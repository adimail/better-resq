import * as tf from '@tensorflow/tfjs'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export const useImageClassifier = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null)
  const [aiScore, setAiScore] = useState<number>(1.0)
  const [isModelLoading, setIsModelLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadModel = async () => {
      console.log('Initializing TF.js environment...')
      try {
        const loadedModel = await tf.loadLayersModel(
          '/models/disaster-net/model.json',
        )
        if (isMounted) {
          setModel(loadedModel)
          setIsModelLoading(false)
          console.log('Model loaded successfully')
        }
      } catch (e) {
        console.error('Failed to load or run model:', e)
        if (isMounted) {
          setIsModelLoading(false)
        }
      }
    }

    loadModel()

    return () => {
      isMounted = false
    }
  }, [])

  const classifyImage = async (file: File): Promise<number> => {
    if (!model) {
      return 1.0
    }

    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise((r) => (img.onload = r))

    const canvas = document.createElement('canvas')
    canvas.width = 224
    canvas.height = 224
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(img, 0, 0, 224, 224)

    try {
      const tensor = tf.browser
        .fromPixels(canvas)
        .expandDims(0)
        .toFloat()
        .div(tf.scalar(255))

      const prediction = model.predict(tensor) as tf.Tensor
      const data = await prediction.data()
      const score = data[0]

      console.log(`AI Confidence Score calculated: ${score}`)

      if (score < 0.4) {
        toast.warning(
          'This image does not appear to show a disaster. Are you sure you want to upload it?',
          { duration: 6000 },
        )
      }
      return score
    } catch (e) {
      console.error('Failed to predict:', e)
      return 1.0
    }
  }

  return { aiScore, setAiScore, isModelLoading, classifyImage }
}
