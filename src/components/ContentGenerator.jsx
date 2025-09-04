import React, { useState } from 'react';
import { Send, Copy, Download, Wand2, Loader2, CheckCircle } from 'lucide-react';
import { OpenAI } from 'openai';

const ContentGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentType, setContentType] = useState('social-post');
  const [copied, setCopied] = useState(false);

  const contentTypes = [
    { value: 'social-post', label: 'Social Media Post', description: 'Engaging posts for social platforms' },
    { value: 'blog-outline', label: 'Blog Post Outline', description: 'Structured outline for blog content' },
    { value: 'email-subject', label: 'Email Subject Lines', description: 'Compelling email subject lines' },
    { value: 'product-description', label: 'Product Description', description: 'Persuasive product copy' },
    { value: 'video-script', label: 'Video Script', description: 'Engaging video script outline' },
  ];

  const generateContent = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedContent('');

    try {
      // Mock API call for demo - replace with actual OpenAI integration
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'demo-key',
        baseURL: "https://openrouter.ai/api/v1",
        dangerouslyAllowBrowser: true,
      });

      // Simulate streaming response for demo
      const mockContent = generateMockContent(contentType, prompt);
      
      // Simulate typing effect
      for (let i = 0; i <= mockContent.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
        setGeneratedContent(mockContent.substring(0, i));
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Sorry, there was an error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockContent = (type, userPrompt) => {
    const templates = {
      'social-post': `🚀 ${userPrompt}

Did you know that 73% of businesses are now leveraging AI to boost their productivity? Here's what I've learned about ${userPrompt.toLowerCase()}:

✨ Key insights:
• AI tools can save up to 40% of your time
• Automation leads to better consistency
• Creative workflows become more efficient

What's your experience with AI in your workflow? Drop a comment below! 👇

#AI #Productivity #Innovation #Technology`,

      'blog-outline': `# ${userPrompt}: A Comprehensive Guide

## Introduction
- Hook: Why ${userPrompt.toLowerCase()} matters in today's digital landscape
- Problem statement
- What readers will learn

## Section 1: Understanding the Basics
- Definition and key concepts
- Current market trends
- Common misconceptions

## Section 2: Benefits and Opportunities
- Primary advantages
- Real-world applications
- Case studies and examples

## Section 3: Implementation Strategy
- Step-by-step approach
- Tools and resources needed
- Best practices and tips

## Section 4: Common Challenges and Solutions
- Potential obstacles
- How to overcome them
- Expert recommendations

## Conclusion
- Key takeaways
- Action steps for readers
- Future outlook

## Call to Action
- Encourage engagement
- Next steps for implementation`,

      'email-subject': `Here are 5 compelling email subject lines for "${userPrompt}":

1. 🔥 Last chance: ${userPrompt} (ending soon!)
2. Quick question about ${userPrompt}...
3. [URGENT] Your ${userPrompt} strategy needs this
4. 3 secrets about ${userPrompt} nobody talks about
5. Free guide: Master ${userPrompt} in 30 days

Additional variations:
• "${userPrompt}: The complete beginner's guide"
• "How [Name] increased ${userPrompt} by 300%"
• "The #1 mistake people make with ${userPrompt}"
• "${userPrompt} just got easier (see how)"
• "Your ${userPrompt} results in 5 minutes"`,

      'product-description': `${userPrompt} - Transform Your Experience Today

🌟 **What makes this special?**
Our ${userPrompt.toLowerCase()} combines cutting-edge technology with intuitive design to deliver exceptional results every time.

✅ **Key Benefits:**
• Save up to 5 hours per week
• Increase efficiency by 80%
• User-friendly interface
• 24/7 customer support
• 30-day money-back guarantee

🎯 **Perfect for:**
• Busy professionals
• Growing businesses
• Anyone looking to optimize their workflow

🚀 **Get Started Today**
Join thousands of satisfied customers who've already transformed their ${userPrompt.toLowerCase()} experience.

Order now and get FREE shipping + bonus materials worth $97!`,

      'video-script': `# Video Script: ${userPrompt}

**[HOOK - First 5 seconds]**
"What if I told you that ${userPrompt.toLowerCase()} could change everything you know about [topic]?"

**[INTRODUCTION - 5-15 seconds]**
Hi everyone! Today we're diving deep into ${userPrompt.toLowerCase()}, and I'm going to share some insights that will completely transform your perspective.

**[MAIN CONTENT - 15 seconds - 2 minutes]**

**Point 1: The Problem**
Most people struggle with ${userPrompt.toLowerCase()} because...

**Point 2: The Solution**
Here's what actually works...

**Point 3: The Results**
When you implement this correctly, you'll see...

**[CALL TO ACTION - Last 10 seconds]**
If you found this helpful, smash that like button, subscribe for more content like this, and let me know in the comments what you'd like to see next!

**[END SCREEN]**
Don't forget to check out my other videos on related topics!`
    };

    return templates[type] || `Generated content for: ${userPrompt}

This is a sample response that demonstrates how the AI content generator would work. In a production environment, this would be replaced with actual AI-generated content using the OpenAI API or similar service.

Key points about ${userPrompt}:
• Relevant and engaging content
• Tailored to your specific needs
• Professional quality output
• Ready to use or customize further

Thank you for trying ContentSpark!`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadContent = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `generated-content-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">AI Content Generator</h1>
            <p className="text-white/80">Generate high-quality content with AI assistance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Content Settings</h2>
          
          {/* Content Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">Content Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setContentType(type.value)}
                  className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                    contentType === type.value
                      ? 'border-blue-400 bg-blue-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40'
                  }`}
                >
                  <div className="font-medium mb-1">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Content Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what content you want to generate..."
              className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateContent}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              !prompt.trim() || isGenerating
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'btn-primary hover:shadow-xl'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Generated Content</h2>
            {generatedContent && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-200"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={downloadContent}
                  className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all duration-200"
                  title="Download content"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
            {generatedContent ? (
              <pre className="text-white/90 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {generatedContent}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                <div className="text-center">
                  <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Your generated content will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentGenerator;