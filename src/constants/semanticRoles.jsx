export const SEMANTIC_ROLES = [
  // Living things
  'animal', 'mythical_creature', 'person', 'profession', 'celebrity',
  // Actions
  'action_verb', 'emotion_verb', 'motion_verb', 'thinking_verb',
  // Descriptors
  'adjective_color', 'adjective_size', 'adjective_emotion', 'adjective_quality',
  'adjective_funny', 'adjective_scary',
  // Objects & Plac
  'noun_object', 'noun_place', 'noun_food', 'noun_nature', 'noun_building',
  // Abstract
  'abstract_concept', 'body_part', 'tool', 'vehicle', 'weather',
  'time_period', 'number_word', 'sound', 'material'
];

export const DEFAULT_SETTINGS = {
  populationSize: 5, 
  mutationRate: 0.3,
  eliteSize: 1,       
  maxGenerations: 10,
};

export const DEFAULT_INPUT = `Mercury
Venus
Earth
Mars
Jupiter
Saturn
Uranus
Neptune`;

export const DEFAULT_TOPIC = 'planets in order';