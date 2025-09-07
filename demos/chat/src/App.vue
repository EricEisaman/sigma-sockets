<template>
  <v-app>
    <v-app-bar app color="primary" dark elevation="4" height="auto" class="py-3">
      <v-container fluid class="py-0">
        <!-- Mobile Layout -->
        <v-row class="d-flex d-md-none" no-gutters>
          <v-col cols="12">
            <v-row align="center" no-gutters class="mb-2">
              <v-col cols="auto">
                <div class="d-flex align-center">
                  <v-avatar size="40" color="secondary" class="mr-3">
                    <v-icon size="24" color="white">mdi-lightning-bolt</v-icon>
                  </v-avatar>
                  <div>
                    <h1 class="text-h5 font-weight-bold text-white mb-0">
                      SigmaSockets
                    </h1>
                    <p class="text-caption text-white opacity-80 mb-0">
                      Real-time Chat Demo
                    </p>
                  </div>
                </div>
              </v-col>
            </v-row>
            <v-row justify="center" no-gutters>
              <v-col cols="auto" class="mr-2">
                <v-chip
                  v-if="connectionStatus === 'connected'"
                  color="info"
                  size="small"
                  variant="elevated"
                >
                  <v-icon start size="small">mdi-account-group</v-icon>
                  {{ userCount }} user{{ userCount !== 1 ? 's' : '' }}
                </v-chip>
              </v-col>
              <v-col cols="auto">
                <v-chip
                  :color="connectionStatus === 'connected' ? 'success' : 'error'"
                  size="small"
                  variant="elevated"
                >
                  <v-icon start size="small">
                    {{ connectionStatus === 'connected' ? 'mdi-wifi' : 'mdi-wifi-off' }}
                  </v-icon>
                  {{ formattedConnectionStatus }}
                </v-chip>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Desktop Layout -->
        <v-row class="d-none d-md-flex" align="center" no-gutters>
          <v-col cols="auto">
            <div class="d-flex align-center">
              <v-avatar size="40" color="secondary" class="mr-3">
                <v-icon size="24" color="white">mdi-lightning-bolt</v-icon>
              </v-avatar>
              <div>
                <h1 class="text-h6 font-weight-bold text-white mb-0">
                  SigmaSockets
                </h1>
                <p class="text-caption text-white opacity-80 mb-0">
                  Chat Demo
                </p>
              </div>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto" class="mr-2">
            <v-chip
              v-if="connectionStatus === 'connected'"
              color="info"
              size="small"
              variant="elevated"
            >
              <v-icon start size="small">mdi-account-group</v-icon>
              {{ userCount }} user{{ userCount !== 1 ? 's' : '' }}
            </v-chip>
          </v-col>
          <v-col cols="auto">
            <v-chip
              :color="connectionStatus === 'connected' ? 'success' : 'error'"
              size="small"
              variant="elevated"
            >
              <v-icon start size="small">
                {{ connectionStatus === 'connected' ? 'mdi-wifi' : 'mdi-wifi-off' }}
              </v-icon>
              {{ formattedConnectionStatus }}
            </v-chip>
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4 pa-md-6 pa-lg-8">
        <v-row justify="center">
          <v-col cols="12" xl="10" lg="11" md="12">
            <v-row class="pt-16 pt-md-10">
              <!-- Main Chat Area -->
              <v-col cols="12" lg="8">
                <v-card elevation="8" rounded="xl">
                  <v-card-title color="primary" class="pa-4 pa-md-6 pa-lg-8">
                    <div class="d-flex align-center">
                      <v-icon size="28" class="mr-3" color="primary">mdi-chat-processing</v-icon>
                      <h2 class="text-h5 font-weight-bold mb-0">Live Chat</h2>
                      <v-spacer></v-spacer>
                      <v-chip color="primary" variant="tonal" size="small">
                        {{ messages.length }} messages
                      </v-chip>
                    </div>
                  </v-card-title>
                  
                  <v-card-text class="pa-0">
                    <v-sheet height="500" class="pa-4 overflow-y-auto">
                      <div v-if="messages.length === 0" class="d-flex flex-column align-center justify-center pa-8">
                        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chat-outline</v-icon>
                        <h3 class="text-h6 text-grey-lighten-1 mb-2">No messages yet</h3>
                        <p class="text-body-2 text-grey-lighten-1">Start the conversation!</p>
                      </div>
                      <div
                        v-for="message in messages"
                        :key="message.id"
                        class="mb-4"
                      >
                        <v-card
                          :color="getMessageColor(message)"
                          :variant="getMessageVariant(message)"
                          elevation="2"
                          rounded="lg"
                        >
                          <v-card-text class="pa-4">
                            <div class="d-flex align-start">
                              <v-avatar 
                                :color="getMessageColor(message)" 
                                size="40" 
                                class="mr-4"
                              >
                                <v-icon color="white">mdi-account</v-icon>
                              </v-avatar>
                              <div class="flex-grow-1">
                                <div class="d-flex align-center mb-2">
                                  <span class="text-subtitle-2 font-weight-bold">
                                    {{ message.username }}
                                  </span>
                                  <v-spacer></v-spacer>
                                  <span class="text-caption text-medium-emphasis">
                                    {{ formatTime(message.timestamp) }}
                                  </span>
                                </div>
                                <div class="text-body-1">
                                  {{ message.data?.message || 'No message content' }}
                                </div>
                              </div>
                            </div>
                          </v-card-text>
                        </v-card>
                      </div>
                    </v-sheet>
                  </v-card-text>

                  <v-card-actions class="pa-6 pt-0">
                    <v-row no-gutters>
                      <v-col cols="12">
                        <v-text-field
                          v-model="messageInput"
                          placeholder="Type your message... Try: /color blue Hello World!"
                          variant="outlined"
                          density="comfortable"
                          hide-details
                          @keyup.enter="sendMessage"
                          :disabled="isInputDisabled"
                          rounded="lg"
                        >
                          <template #append-inner>
                            <v-btn
                              color="primary"
                              @click="sendMessage"
                              :disabled="!messageInput.trim() || isInputDisabled"
                              icon="mdi-send"
                              size="large"
                              variant="elevated"
                            ></v-btn>
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>
                  </v-card-actions>
                </v-card>
              </v-col>

              <!-- Sidebar -->
              <v-col cols="12" lg="4">
                <v-row>
                  <!-- Commands Card -->
                  <v-col cols="12">
                    <v-card elevation="6" rounded="xl" class="mb-4">
                      <v-card-title color="primary" class="pa-4 pa-md-5 pa-lg-6">
                        <v-icon size="24" class="mr-2" color="primary">mdi-code-tags</v-icon>
                        Commands
                      </v-card-title>
                      <v-card-text class="pa-4 pa-md-5 pa-lg-6">
                        <v-list density="compact">
                          <v-list-item class="px-0">
                            <template #prepend>
                              <v-icon color="success">mdi-message-text</v-icon>
                            </template>
                            <v-list-item-title class="font-weight-medium">Regular Message</v-list-item-title>
                            <v-list-item-subtitle>Just type and send</v-list-item-subtitle>
                          </v-list-item>
                          <v-divider class="my-2"></v-divider>
                          <v-list-item class="px-0">
                            <template #prepend>
                              <v-icon color="primary">mdi-palette</v-icon>
                            </template>
                            <v-list-item-title class="font-weight-medium">Color Message</v-list-item-title>
                            <v-list-item-subtitle>/color &lt;color&gt; &lt;message&gt;</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <!-- Colors Card -->
                  <v-col cols="12">
                    <v-card elevation="6" rounded="xl">
                      <v-card-title color="primary">
                        <v-icon size="24" class="mr-2" color="primary">mdi-palette-advanced</v-icon>
                        Available Colors
                      </v-card-title>
                      <v-card-text>
                        <div class="d-flex flex-wrap justify-center">
                          <v-chip
                            v-for="color in availableColors"
                            :key="color"
                            :color="color"
                            size="small"
                            class="ma-1"
                            @click="insertColorCommand(color)"
                          >
                            {{ color }}
                          </v-chip>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { MessageType, ColorMessage, ChatMessage, UserCountMessage, AllMessageTypes } from './types.js'
import { parseColorCommand } from './color-parser.js'
import { SigmaSocketClient, ConnectionStatus } from 'sigmasockets-client'
import * as flatbuffers from 'flatbuffers'
import { Message } from './generated/sigma-sockets/message.js'
import { MessageType as FlatBuffersMessageType } from './generated/sigma-sockets/message-type.js'
import { DataMessage } from './generated/sigma-sockets/data-message.js'

// Available colors for the color picker
const availableColors = ref([
  'blue', 'green', 'orange', 'red', 'purple', 'indigo', 'teal', 'cyan', 
  'pink', 'amber', 'yellow', 'lime', 'light-green', 'deep-orange', 
  'deep-purple', 'brown', 'blue-grey', 'grey', 'black', 'white', 
  'tan', 'navy', 'maroon', 'olive', 'aqua', 'fuchsia', 'silver', 'gray'
])

// Reactive data
const messages = ref<MessageType[]>([])
const messageInput = ref('')
const connectionStatus = ref<ConnectionStatus>(ConnectionStatus.Disconnected)
const messagesContainer = ref<HTMLElement>()
const userCount = ref<number>(0)
const username = ref(`User_${Math.random().toString(36).substr(2, 9)}`)

// WebSocket client
let client: SigmaSocketClient | null = null

// Message handling
const addMessage = (message: MessageType) => {
  messages.value.push({
    ...message,
    id: Date.now() + Math.random()
  } as MessageType & { id: number })
  
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const getMessageColor = (message: MessageType): string => {
  if (message.type === 'color') {
    const colorMessage = message as ColorMessage
    return colorMessage.data.color
  }
  return 'primary'
}

const getMessageVariant = (message: MessageType): string => {
  if (message.type === 'color') {
    return 'tonal'
  }
  return 'outlined'
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const formattedConnectionStatus = computed(() => {
  return connectionStatus.value.charAt(0).toUpperCase() + connectionStatus.value.slice(1)
})

const isInputDisabled = computed(() => {
  const disabled = connectionStatus.value !== 'connected'
  // Only log in debug mode to avoid console spam
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
    console.log('🔧 Input disabled state:', disabled, '(connection status:', connectionStatus.value, ')')
  }
  return disabled
})

const insertColorCommand = (color: string) => {
  messageInput.value = `/color ${color} `
}

const sendMessage = () => {
  if (!messageInput.value.trim() || !client) return

  const input = messageInput.value.trim()
  const colorParse = parseColorCommand(input)

  let message: MessageType

  if (colorParse.isColorCommand && colorParse.color && colorParse.message) {
    message = {
      type: 'color',
      username: username.value,
      timestamp: Date.now(),
      data: {
        color: colorParse.color,
        message: colorParse.message
      }
    } as ColorMessage
  } else {
    message = {
      type: 'chat',
      username: username.value,
      timestamp: Date.now(),
      data: {
        message: input
      }
    } as ChatMessage
  }

  // Create FlatBuffers message properly
  const builder = new flatbuffers.Builder(1024)
  const payload = builder.createString(JSON.stringify(message))
  
  DataMessage.startDataMessage(builder)
  DataMessage.addPayload(builder, payload)
  const dataMessage = DataMessage.endDataMessage(builder)
  
  Message.startMessage(builder)
  Message.addType(builder, FlatBuffersMessageType.Data)
  Message.addData(builder, dataMessage)
  const messageObj = Message.endMessage(builder)
  
  builder.finish(messageObj)
  const data = builder.asUint8Array()
  
  // Debug logging only in development
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
    console.log('Sending message:', message)
    console.log('🔧 Created FlatBuffers message, size:', data.length)
    console.log('🔧 Data being passed to client.send():', data)
  }
  
  const success = client.send(data)
  
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
    console.log('Send result:', success)
  }

  // Clear input (message will be added when received back from server)
  messageInput.value = ''
}

// WebSocket connection
const connect = async () => {
  try {
    connectionStatus.value = ConnectionStatus.Connecting
    
    // Use production WebSocket URL or fallback to localhost for development
    const wsUrl = import.meta.env.PROD 
      ? `wss://${window.location.host}` 
      : 'ws://localhost:3001'
    
    // Use debug mode in development, false in production
    const isDebugMode = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true'
    
    client = new SigmaSocketClient({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 60000, // Increased from 30s to 60s to reduce bandwidth
      debug: isDebugMode
    })

    // Log client version for debugging
    if (isDebugMode) {
      console.log('🔧 SigmaSocketClient version:', client.getVersion?.() || 'unknown')
      console.log('🔧 Client debug mode:', isDebugMode)
    }

    client.on('connection', (status: ConnectionStatus) => {
      if (isDebugMode) {
        console.log('🔧 Chat demo received connection status change:', status)
      }
      connectionStatus.value = status
    })

    client.on('message', (data: Uint8Array) => {
      try {
        const decoder = new TextDecoder()
        const jsonString = decoder.decode(data)
        const message = JSON.parse(jsonString) as AllMessageTypes
        
        // Handle system messages separately from chat messages
        if (message.type === 'userCount') {
          const userCountMessage = message as UserCountMessage
          userCount.value = userCountMessage.count
        } else if (message.type === 'chat' || message.type === 'color') {
          // Only add chat messages to the messages array
          addMessage(message as MessageType)
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })

    client.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
      connectionStatus.value = ConnectionStatus.Error
      
      // The client should handle reconnection automatically
      // Only attempt manual reconnection if we're still in error state after a longer delay
      setTimeout(() => {
        if (connectionStatus.value === ConnectionStatus.Error) {
          if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
            console.log('Manual reconnection attempt after extended error state...')
          }
          client.connect().catch((reconnectError) => {
            console.error('Manual reconnection failed:', reconnectError)
          })
        }
      }, 15000) // Wait 15 seconds before manual reconnection attempt
    })

    client.on('reconnecting', (info: any) => {
      if (isDebugMode) {
        console.log('WebSocket reconnecting:', info)
      }
      connectionStatus.value = ConnectionStatus.Reconnecting
    })

    await client.connect()
  } catch (error) {
    console.error('Failed to connect:', error)
    connectionStatus.value = ConnectionStatus.Error
  }
}

// Watch connection status changes
watch(connectionStatus, (newStatus, oldStatus) => {
  // Connection status changed
}, { immediate: true })

// Lifecycle
onMounted(() => {
  connect()
})

onUnmounted(() => {
  if (client) {
    client.disconnect()
  }
})
</script>

