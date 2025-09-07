import { SigmaSocketClient, ConnectionStatus } from 'sigmasockets-client'
import * as flatbuffers from 'flatbuffers'
import { Message } from './generated/sigma-sockets/message.js'
import { MessageType } from './generated/sigma-sockets/message-type.js'
import { DataMessage } from './generated/sigma-sockets/data-message.js'

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
    this.messageInput = document.getElementById('messageInput') as HTMLInputElement
    this.sendButton = document.getElementById('sendButton') as HTMLButtonElement
    this.statusDiv = document.getElementById('status') as HTMLDivElement
    this.messagesDiv = document.getElementById('messages') as HTMLDivElement
    this.userCountDiv = document.getElementById('userCount') as HTMLDivElement
  }

  private setupClient() {
    this.client = new SigmaSocketClient({
      url: 'ws://localhost:3001',
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    })

    this.client.on('connection', (status: typeof ConnectionStatus) => {
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

  private updateStatus(status: typeof ConnectionStatus) {
    this.statusDiv.className = `status ${status}`
    
    switch (status) {
      case ConnectionStatus.Connected:
        this.statusDiv.textContent = 'Connected'
        this.messageInput.disabled = false
        this.sendButton.disabled = false
        this.addSystemMessage('Connected to chat server!')
        break
      case ConnectionStatus.Connecting:
        this.statusDiv.textContent = 'Connecting...'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
      case ConnectionStatus.Reconnecting:
        this.statusDiv.textContent = 'Reconnecting...'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
      case ConnectionStatus.Disconnected:
        this.statusDiv.textContent = 'Disconnected'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
      case ConnectionStatus.Error:
        this.statusDiv.textContent = 'Connection Error'
        this.messageInput.disabled = true
        this.sendButton.disabled = true
        break
    }
  }

  private sendMessage() {
    const message = this.messageInput.value.trim()
    if (!message) return

    const chatMessage = {
      username: this.username,
      message: message,
      timestamp: Date.now()
    }

    // Show the message immediately in the UI
    this.addChatMessage(chatMessage.username, chatMessage.message, true)

    // Create FlatBuffers message
    const builder = new flatbuffers.Builder(1024)
    const payload = builder.createString(JSON.stringify(chatMessage))
    
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
      
      if (message.type === 'chat') {
        // Only show messages from other users (not our own, since we already showed them)
        if (message.username !== this.username) {
          this.addChatMessage(message.username, message.message, false)
        }
      } else if (message.type === 'userCount') {
        this.updateUserCount(message.count)
      }
    } catch (error) {
      console.error('Error parsing message:', error)
      console.error('Raw data:', data)
    }
  }

  private addChatMessage(username: string, message: string, isOwn: boolean) {
    const messageDiv = document.createElement('div')
    messageDiv.className = `message ${isOwn ? 'own' : ''}`
    
    const time = new Date().toLocaleTimeString()
    messageDiv.innerHTML = `
      <strong>${username}</strong> <span style="color: #666; font-size: 0.8em;">${time}</span><br>
      ${message}
    `
    
    this.messagesDiv.appendChild(messageDiv)
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
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