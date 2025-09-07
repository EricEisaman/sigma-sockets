import { SigmaSocketClient, ConnectionStatus } from 'sigmasockets-client'
import * as flatbuffers from 'flatbuffers'
import { Message } from './generated/sigma-sockets/message.js'
import { MessageType } from './generated/sigma-sockets/message-type.js'
import { DataMessage } from './generated/sigma-sockets/data-message.js'
import { parseColorCommand, getVuetifyColorClass } from './color-parser.js'
import type { MessageType as ChatMessageType, ColorMessage, ChatMessage } from './types.js'

class ChatDemo {
  private client!: SigmaSocketClient
  private messageInput!: HTMLInputElement
  private sendButton!: HTMLButtonElement
  private statusDiv!: HTMLDivElement
  private messagesDiv!: HTMLDivElement
  private userCountDiv!: HTMLDivElement
  private username: string

  constructor() {
    this.username = `User_${Math.random().toString(36).substr(2, 9)}`
    this.initializeElements()
    this.setupClient()
    this.setupEventListeners()
  }

  private initializeElements() {
    // Wait for Vuetify to initialize
    setTimeout(() => {
      this.messageInput = document.getElementById('messageInput') as HTMLInputElement
      this.sendButton = document.getElementById('sendButton') as HTMLButtonElement
      this.statusDiv = document.getElementById('status') as HTMLDivElement
      this.messagesDiv = document.getElementById('messagesContainer') as HTMLDivElement
      this.userCountDiv = document.getElementById('userCount') as HTMLDivElement
    }, 100)
  }

  private setupClient() {
    this.client = new SigmaSocketClient({
      url: 'ws://localhost:3001',
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    })

    this.client.on('connection', (status: ConnectionStatus) => {
      this.updateStatus(status)
    })

    this.client.on('message', (data: Uint8Array) => {
      this.handleMessage(data)
    })

    this.client.on('error', (error: Error) => {
      console.error('Connection error:', error)
      this.addSystemMessage(`Error: ${error.message}`)
    })
  }

  private setupEventListeners() {
    this.sendButton.addEventListener('click', () => {
      this.sendMessage()
    })

    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage()
      }
    })
  }

  private updateStatus(status: ConnectionStatus) {
    if (!this.statusDiv || !this.messageInput || !this.sendButton) return
    
    let type = 'error'
    let text = 'Disconnected'
    
    switch (status) {
      case ConnectionStatus.Connected:
        type = 'success'
        text = 'Connected'
        this.messageInput.disabled = false
        this.sendButton.disabled = false
        this.addSystemMessage('Connected to chat server!')
        break
      case ConnectionStatus.Connecting:
        type = 'warning'
        text = 'Connecting...'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
      case ConnectionStatus.Reconnecting:
        type = 'warning'
        text = 'Reconnecting...'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
      case ConnectionStatus.Disconnected:
        type = 'error'
        text = 'Disconnected'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
      case ConnectionStatus.Error:
        type = 'error'
        text = 'Connection Error'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
    }
    
    // Update Vuetify alert
    this.statusDiv.setAttribute('type', type)
    this.statusDiv.setAttribute('text', text)
  }

  private sendMessage() {
    const message = this.messageInput.value.trim()
    if (!message) return

    // Parse for color command
    const colorParseResult = parseColorCommand(message)
    
    let structuredMessage: ChatMessageType
    
    if (colorParseResult.isColorCommand && colorParseResult.color && colorParseResult.message) {
      // Create color message
      structuredMessage = {
        type: 'color',
        username: this.username,
        timestamp: Date.now(),
        data: {
          color: colorParseResult.color,
          message: colorParseResult.message
        }
      }
    } else {
      // Create regular chat message
      structuredMessage = {
        type: 'chat',
        username: this.username,
        timestamp: Date.now(),
        data: {
          message: message
        }
      }
    }

    // Show the message immediately in the UI
    this.addStructuredMessage(structuredMessage, true)

    // Create FlatBuffers message
    const builder = new flatbuffers.Builder(1024)
    const payload = builder.createString(JSON.stringify(structuredMessage))
    
    DataMessage.startDataMessage(builder)
    DataMessage.addPayload(builder, payload)
    const dataMessage = DataMessage.endDataMessage(builder)
    
    Message.startMessage(builder)
    Message.addType(builder, MessageType.Data)
    Message.addData(builder, dataMessage)
    const messageObj = Message.endMessage(builder)
    
    builder.finish(messageObj)
    const data = builder.asUint8Array()
    
    console.log('Sending FlatBuffers message, size:', data.length)
    this.client.send(data)
    this.messageInput.value = ''
  }

  private handleMessage(data: Uint8Array) {
    try {
      // The server broadcasts JSON messages, so decode as text
      const messageText = new TextDecoder().decode(data)
      console.log('Received message:', messageText)
      const message = JSON.parse(messageText)
      
      if (message.type === 'chat' || message.type === 'color') {
        // Only show messages from other users (not our own, since we already showed them)
        if (message.username !== this.username) {
          this.addStructuredMessage(message, false)
        }
      } else if (message.type === 'userCount') {
        this.updateUserCount(message.count)
      }
    } catch (error) {
      console.error('Error parsing message:', error)
      console.error('Raw data:', data)
    }
  }

  private addStructuredMessage(message: ChatMessageType, isOwn: boolean) {
    const messageDiv = document.createElement('div')
    messageDiv.className = 'mb-2'
    
    const time = new Date(message.timestamp).toLocaleTimeString()
    
    // Create Vuetify alert component
    const alertDiv = document.createElement('div')
    alertDiv.className = 'v-alert v-alert--variant-tonal'
    
    // Determine color and styling based on message type
    let colorClass = 'blue'
    let messageText = ''
    
    if (message.type === 'color') {
      const colorMessage = this.isColorMessage(message)
      if (colorMessage) {
        const vuetifyColor = getVuetifyColorClass(colorMessage.data.color)
        colorClass = vuetifyColor
        messageText = colorMessage.data.message
      }
    } else {
      const chatMessage = this.isChatMessage(message)
      if (chatMessage) {
        messageText = chatMessage.data.message
        colorClass = isOwn ? 'primary' : 'blue'
      }
    }
    
    alertDiv.className += ` v-alert--color-${colorClass}`
    
    // Create the message content
    const contentDiv = document.createElement('div')
    contentDiv.innerHTML = `
      <div class="d-flex align-center mb-1">
        <strong class="text-subtitle-2">${message.username}</strong>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">${time}</span>
      </div>
      <div class="text-body-2">${messageText}</div>
    `
    
    alertDiv.appendChild(contentDiv)
    messageDiv.appendChild(alertDiv)
    
    this.messagesDiv.appendChild(messageDiv)
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
  }
  
  private isColorMessage(message: ChatMessageType): ColorMessage | null {
    return message.type === 'color' ? message : null
  }
  
  private isChatMessage(message: ChatMessageType): ChatMessage | null {
    return message.type === 'chat' ? message : null
  }

  private addSystemMessage(message: string) {
    const messageDiv = document.createElement('div')
    messageDiv.className = 'message system'
    messageDiv.textContent = message
    
    this.messagesDiv.appendChild(messageDiv)
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
  }

  private updateUserCount(count: number) {
    this.userCountDiv.textContent = `Connected users: ${count}`
  }

  public async start() {
    try {
      await this.client.connect()
    } catch (error) {
      console.error('Failed to connect:', error)
      this.addSystemMessage('Failed to connect to chat server. Please check if the server is running.')
    }
  }
}

// Initialize the chat demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const chatDemo = new ChatDemo()
  chatDemo.start()
})