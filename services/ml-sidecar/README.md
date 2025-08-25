# ML Sidecar Service

The ML Sidecar service provides real machine learning capabilities for podcast transcription, summarization, and personalized recommendations.

## Features

### 🎙️ Audio Transcription
- **Model**: OpenAI Whisper (base model)
- **Input**: Audio URL from S3
- **Output**: Full transcript with language detection
- **Supports**: MP3, WAV, and other common audio formats

### 📝 Text Summarization  
- **Model**: Facebook BART (bart-large-cnn)
- **Input**: Transcript text
- **Output**: Concise summary + keyword extraction
- **Features**: Handles long podcasts by chunking

### 🎯 Personalized Recommendations
- **Algorithm**: Content-based filtering using TF-IDF similarity
- **Learning**: User actions (play, skip, like, dislike, share)
- **Output**: Personalized podcast recommendations with confidence scores

## API Endpoints

### Transcription
```bash
POST /transcribe
{
  "podcast_id": "your-podcast-id"
}
```

### Summarization
```bash
POST /summarize
{
  "podcast_id": "your-podcast-id"
}
```

### Recommendations
```bash
POST /train_recs
{
  "user_id": "your-user-id"
}
```

### User Action Tracking
```bash
POST /user_action
{
  "user_id": "user123",
  "podcast_id": "podcast456", 
  "action": "like",
  "metadata": {"source": "mobile_app"}
}
```

### Health Check
```bash
GET /health
```

## User Actions for ML Training

The recommendation system learns from these user actions:

- **`play`** - User started playing a podcast
- **`skip`** - User skipped a podcast  
- **`like`** - User liked/favorited a podcast
- **`dislike`** - User disliked a podcast
- **`share`** - User shared a podcast

## ML Models Information

### Whisper Transcription
- **Model Size**: Base (74M parameters)
- **Languages**: 99 languages supported
- **Accuracy**: ~95% for English audio
- **Processing Time**: ~1x real-time

### BART Summarization
- **Model**: facebook/bart-large-cnn
- **Max Input**: 1024 tokens per chunk
- **Summary Length**: 30-200 words
- **Quality**: State-of-the-art abstractive summarization

### Recommendation Engine
- **Type**: Content-based collaborative filtering
- **Features**: Keyword similarity, user behavior patterns
- **Cold Start**: Falls back to popular content
- **Confidence**: Based on user action history

## Usage Examples

### Through API Routes

Record a user action:
```bash
curl -X POST http://localhost:3000/api/digests/user-action \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "podcastId": "abc123", 
    "action": "like"
  }'
```

Get recommendations:
```bash
curl http://localhost:3000/api/digests/recommendations/user123
```

### Direct ML Sidecar

Check service health:
```bash
curl http://localhost:5001/health
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string  
- `TORCH_HOME` - PyTorch model cache directory
- `HF_HOME` - Hugging Face model cache directory
- `WHISPER_CACHE` - Whisper model cache directory

## Performance Notes

- **GPU Support**: Automatically detects and uses GPU if available
- **Model Caching**: Models are cached on first load
- **Memory Usage**: ~2GB RAM for all models
- **Concurrent Requests**: Single worker recommended for memory management

## Scaling Considerations

For production deployments:

1. **Use larger Whisper models** (`small`, `medium`, `large`) for better accuracy
2. **Add GPU support** for faster processing
3. **Implement model serving** with tools like TorchServe
4. **Scale horizontally** with multiple ml-sidecar instances
5. **Cache frequently accessed data** in Redis

## Troubleshooting

### Common Issues

**Models not loading:**
- Check available memory (need ~2GB)
- Verify internet connection for model downloads
- Check disk space for model cache

**Transcription failures:**
- Verify audio file accessibility
- Check audio format compatibility
- Monitor ffmpeg/librosa dependencies

**Poor recommendations:**
- Ensure user actions are being recorded
- Check that podcast summaries exist
- Verify MongoDB connectivity 