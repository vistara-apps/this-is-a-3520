import React, { useState } from 'react';
import { Upload, Link, Scissors, Download, Play, FileText, Video, Loader2 } from 'lucide-react';

const ContentRepurposer = () => {
  const [inputMethod, setInputMethod] = useState('upload');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [outputFormat, setOutputFormat] = useState('clips');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState(null);

  const inputMethods = [
    { value: 'upload', label: 'Upload File', icon: Upload, description: 'Upload video, audio, or text files' },
    { value: 'url', label: 'From URL', icon: Link, description: 'Extract from YouTube, podcast, etc.' },
  ];

  const outputFormats = [
    { value: 'clips', label: 'Short Clips', icon: Scissors, description: 'Extract key moments as short clips' },
    { value: 'quotes', label: 'Quote Cards', icon: FileText, description: 'Generate shareable quote graphics' },
    { value: 'summary', label: 'Summary', icon: FileText, description: 'Create concise content summaries' },
    { value: 'transcripts', label: 'Transcripts', icon: FileText, description: 'Generate text transcriptions' },
  ];

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processContent = async () => {
    if ((!file && inputMethod === 'upload') || (!url && inputMethod === 'url')) return;

    setIsProcessing(true);
    setProcessedContent(null);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock processed content
    const mockResults = {
      clips: [
        { title: 'Key Insight #1', duration: '0:45', thumbnail: '🎬', content: 'Main point about the topic discussed in the first segment...' },
        { title: 'Expert Quote', duration: '0:32', thumbnail: '💬', content: 'Memorable quote or statement from the content...' },
        { title: 'Action Item', duration: '0:28', thumbnail: '✅', content: 'Practical takeaway or actionable advice...' },
      ],
      quotes: [
        { text: '"Innovation is the key to staying ahead in today\'s competitive market."', author: 'Speaker', context: 'From minute 12:34' },
        { text: '"Success comes from consistent daily actions, not occasional heroic efforts."', author: 'Speaker', context: 'From minute 25:18' },
        { text: '"The future belongs to those who adapt quickly to change."', author: 'Speaker', context: 'From minute 38:42' },
      ],
      summary: {
        title: 'Content Summary',
        keyPoints: [
          'Main topic discussion and introduction',
          'Key insights and expert perspectives',
          'Practical applications and real-world examples',
          'Actionable takeaways for implementation',
          'Future trends and predictions'
        ],
        wordCount: 250,
        readTime: '2 minutes'
      },
      transcripts: {
        fullText: `This is a sample transcript of the processed content. In a real implementation, this would contain the complete transcription of the uploaded audio/video content.

The transcript would include timestamps, speaker identification, and properly formatted text that can be used for various purposes such as creating blog posts, social media content, or accessibility improvements.

Key sections would be highlighted and categorized for easy navigation and content extraction.`,
        timestamps: true,
        speakers: ['Speaker 1', 'Speaker 2']
      }
    };

    setProcessedContent(mockResults[outputFormat]);
    setIsProcessing(false);
  };

  const downloadResults = () => {
    const content = JSON.stringify(processedContent, null, 2);
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `repurposed-content-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderProcessedContent = () => {
    if (!processedContent) return null;

    switch (outputFormat) {
      case 'clips':
        return (
          <div className="space-y-4">
            {processedContent.map((clip, index) => (
              <div key={index} className="bg-white/5 border border-white/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{clip.thumbnail}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{clip.title}</h3>
                    <p className="text-sm text-white/60">Duration: {clip.duration}</p>
                  </div>
                  <button className="btn-secondary text-xs py-1 px-3">
                    <Play className="w-3 h-3 mr-1" />
                    Preview
                  </button>
                </div>
                <p className="text-white/80 text-sm">{clip.content}</p>
              </div>
            ))}
          </div>
        );

      case 'quotes':
        return (
          <div className="space-y-4">
            {processedContent.map((quote, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 rounded-lg p-6">
                <blockquote className="text-lg font-medium text-white mb-3">
                  {quote.text}
                </blockquote>
                <div className="flex justify-between items-center text-sm text-white/60">
                  <span>— {quote.author}</span>
                  <span>{quote.context}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'summary':
        return (
          <div className="bg-white/5 border border-white/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">{processedContent.title}</h3>
            <div className="flex gap-4 mb-6 text-sm text-white/60">
              <span>📄 {processedContent.wordCount} words</span>
              <span>⏱️ {processedContent.readTime} read</span>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Key Points:</h4>
              <ul className="space-y-2">
                {processedContent.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-white/80">
                    <span className="text-blue-400 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'transcripts':
        return (
          <div className="bg-white/5 border border-white/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Full Transcript</h3>
              <div className="flex gap-2 text-sm text-white/60">
                {processedContent.timestamps && <span>🕒 Timestamped</span>}
                <span>👥 {processedContent.speakers.length} speakers</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed">
                {processedContent.fullText}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Content Repurposer</h1>
            <p className="text-white/80">Transform long-form content into engaging short clips</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Source Content</h2>

          {/* Input Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">Input Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inputMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    onClick={() => setInputMethod(method.value)}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                      inputMethod === method.value
                        ? 'border-green-400 bg-green-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{method.label}</span>
                    </div>
                    <div className="text-xs opacity-70">{method.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload */}
          {inputMethod === 'upload' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">Upload File</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="video/*,audio/*,.txt,.pdf"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-white/60 mb-3" />
                  <p className="text-white/80 mb-2">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-white/60">
                    Video, Audio, or Text files up to 100MB
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* URL Input */}
          {inputMethod === 'url' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">Content URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              <p className="text-xs text-white/60 mt-2">
                Supports YouTube, Vimeo, podcast platforms, and more
              </p>
            </div>
          )}

          {/* Output Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">Output Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outputFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.value}
                    onClick={() => setOutputFormat(format.value)}
                    className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                      outputFormat === format.value
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{format.label}</span>
                    </div>
                    <div className="text-xs opacity-70">{format.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={processContent}
            disabled={(!file && inputMethod === 'upload') || (!url && inputMethod === 'url') || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              (!file && inputMethod === 'upload') || (!url && inputMethod === 'url') || isProcessing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'btn-primary hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                Repurpose Content
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Repurposed Content</h2>
            {processedContent && (
              <button
                onClick={downloadResults}
                className="btn-secondary text-sm py-2 px-3"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
            )}
          </div>

          <div className="min-h-[400px]">
            {isProcessing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto text-white/60 mb-3 animate-spin" />
                  <p className="text-white/80">Processing your content...</p>
                  <p className="text-sm text-white/60 mt-1">This may take a few moments</p>
                </div>
              </div>
            ) : processedContent ? (
              <div className="animate-slide-up">
                {renderProcessedContent()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                <div className="text-center">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Your repurposed content will appear here</p>
                  <p className="text-sm mt-1">Upload content and click process to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentRepurposer;