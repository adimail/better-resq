export class ResQStream {
  private eventSource: EventSource | null = null
  private url: string

  constructor(lat: number, lng: number, radius = 5000) {
    const token = localStorage.getItem('access_token')
    const baseURL = import.meta.env.VITE_API_BASE_URL

    this.url = `${baseURL}/stream/events?lat=${lat}&lng=${lng}&radius=${radius}&token=${token}`
  }

  connect(onMessage: (data: any) => void, onError: (err: any) => void) {
    this.eventSource = new EventSource(this.url)
    this.eventSource.onmessage = (event) => {
      if (event.data === '\n\n') return
      onMessage(JSON.parse(event.data))
    }
    this.eventSource.onerror = (err) => {
      onError(err)
      this.disconnect()
    }
  }

  disconnect() {
    this.eventSource?.close()
    this.eventSource = null
  }
}
