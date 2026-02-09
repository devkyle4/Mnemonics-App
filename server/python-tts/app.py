from flask import Flask, request, jsonify,Response, send_file
from flask_cors import CORS
import openpyxl
import os
import io
from datetime import datetime
from dotenv import load_dotenv
from TTS.api import TTS
import logging
from save_excel import create_excel_template, EXCEL_FILE_PATH


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

# TTS LOGIC HERE!!!
tts = None

print("Loading XTTS-v2 model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
# tts = TTS("tts_models/en/ljspeech/glow-tts")
# tts = TTS("tts_models/en/ljspeech/speedy-speech")
# tts = TTS("tts_models/en/ek1/tacotron2")
# tts = TTS("tts_models/en/ljspeech/tacotron2-ddc_ph")

print("Model loaded!")


# print(tts.speakers)
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok", 
        "model_loaded": tts is not None
    })

@app.route('/save', methods=['POST'])
def save_mnemonic():
    try:
        data = request.json

        required_fields = ['generation','population','settings', 'bestFitness', 'topic', 'bestMnemonic']

        # Validate required fields
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success':False,
                    'error': f'Missing required field: {field}'
                }),400
            
        # Check if Excel file exists, if not create
        if not os.path.exists(EXCEL_FILE_PATH):
            print("Excel file not found, creating new one...")
            create_excel_template()

        # Load existing workbook
        workbook = openpyxl.load_workbook(EXCEL_FILE_PATH)
        sheet = workbook.active

        #Prepre row data
        new_row = [
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  # Timestamp
            data.get('generation', 0),                     # Generation
            float(data.get('bestFitness', 0)),             # Best Fitness
            float(data.get('avgFitness', 0)),              # Avg Fitness
            float(data.get('genomeFitness', 0)),           # Genome Fitness
            float(data.get('orthoScore', 0)),              # Ortho Score
            int(data.get('populationSize', 5)),            # Population Size
            float(data.get('mutationRate', 0.15)),         # Mutation Rate
            int(data.get('eliteSize', 1)),                 # Elite Size
            int(data.get('maxGenerations', 20)),           # Max Generations
            data.get('topic', 'N/A'),                      # Topic
            data.get('bestMnemonic', 'N/A'),               # Best Mnemonic
            data.get('targetTerms', 'N/A')                 # Target Terms
            ]

        # Append row
        sheet.append(new_row)

        # Save workbook
        workbook.save(EXCEL_FILE_PATH)

        row_number = sheet.max_row

        logger.info(f'Data Saved to row {row_number}')

        return jsonify({
            'success': True,
            'message': 'Data saved successfully',
            'row': row_number
        }),200


    except Exception as e:
        logger.exception("Save failed")
        return jsonify({
            "success": False,
            "error":str(e)
            }),500

@app.route('/download', methods=['GET'])
def download_evolution_data():
    """Download the Excel file"""
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            return jsonify({
                'success': False,
                'error': 'Excel file not found. Save some data first.'
            }), 404
        
        return send_file(
            EXCEL_FILE_PATH,
            as_attachment=True,
            download_name='evolution_data.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        print(f'Error downloading file: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@app.route('/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text')
        language = data.get('language', 'en')
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        if not tts:
            return jsonify({"error": "Model not loaded"}), 503
        
        logger.info("Generating Speech: {text[:50]}...")
        

        # Generate audio to memory buffer
        wav_buffer = io.BytesIO()
        tts.tts_to_file(
            text=text,
            language=language,
            speaker="Ana Florence",
            file_path=wav_buffer
        )

        wav_buffer.seek(0)
        
        return Response(
            wav_buffer.read(),
            mimetype='audio/wav',
            headers={'Content-Disposition': 'inline'}
        )
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f"Starting CoquiTTS server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
