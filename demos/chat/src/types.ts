// Base message interface for all chat messages
export interface BaseMessage {
  username: string
  timestamp: number
}

// Generic message structure for structured object data
export interface StructuredMessage<T extends Record<string, unknown>> extends BaseMessage {
  type: string
  data: T
}

// Color command message structure
export interface ColorMessage extends BaseMessage {
  type: 'color'
  data: {
    color: string
    message: string
  }
}

// Regular chat message structure
export interface ChatMessage extends BaseMessage {
  type: 'chat'
  data: {
    message: string
  }
}

// User count system message (no username/timestamp needed)
export interface UserCountMessage {
  type: 'userCount'
  count: number
}

// Union type for all message types
export type MessageType = ColorMessage | ChatMessage
export type SystemMessage = UserCountMessage
export type AllMessageTypes = MessageType | SystemMessage

// Color parsing result
export interface ColorParseResult {
  isColorCommand: boolean
  color?: string
  message?: string
}

// Vuetify color mapping for common colors
export const VUETIFY_COLORS: Record<string, string> = {
  'red': 'red',
  'pink': 'pink',
  'purple': 'purple',
  'deep-purple': 'deep-purple',
  'indigo': 'indigo',
  'blue': 'blue',
  'light-blue': 'light-blue',
  'cyan': 'cyan',
  'teal': 'teal',
  'green': 'green',
  'light-green': 'light-green',
  'lime': 'lime',
  'yellow': 'yellow',
  'amber': 'amber',
  'orange': 'orange',
  'deep-orange': 'deep-orange',
  'brown': 'brown',
  'blue-grey': 'blue-grey',
  'grey': 'grey',
  'black': 'black',
  'white': 'white',
  'tan': 'brown-lighten-3', // Using Vuetify's brown-lighten-3 for tan
  'navy': 'blue-darken-4',
  'maroon': 'red-darken-4',
  'olive': 'green-darken-2',
  'aqua': 'cyan',
  'fuchsia': 'pink',
  'silver': 'grey-lighten-2',
  'gray': 'grey'
}
