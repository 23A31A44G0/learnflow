import React, { useState } from 'react';
import api, { learnAPI } from '../services/api';
import { useMetacognitive } from '../hooks/useMetacognitive';
import PromptModal from '../components/PromptModal';

// Simple Concept Map Visualization Component
const ConceptMapVisualization: React.FC<{
  conceptMap: ConceptMap;
  currentConcept: string;
  onConceptClick: (conceptName: string) => void;
}> = ({ conceptMap, currentConcept, onConceptClick }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-4">
      <div className="relative" style={{ height: '400px' }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Render edges */}
          {conceptMap.edges.map((edge, index) => {
            const sourceNode = conceptMap.nodes.find(n => n.id === edge.source);
            const targetNode = conceptMap.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            const x1 = (sourceNode.x / 100) * 100;
            const y1 = (sourceNode.y / 100) * 100;
            const x2 = (targetNode.x / 100) * 100;
            const y2 = (targetNode.y / 100) * 100;
            
            return (
              <g key={index}>
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#6B7280"
                  strokeWidth={edge.strength / 5}
                  opacity={0.6}
                />
                <text
                  x={`${(x1 + x2) / 2}%`}
                  y={`${(y1 + y2) / 2}%`}
                  textAnchor="middle"
                  className="fill-gray-500 text-xs"
                  dominantBaseline="middle"
                >
                  {edge.relationship}
                </text>
              </g>
            );
          })}
          
          {/* Render nodes */}
          {conceptMap.nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.type === 'main' ? '25' : node.type === 'secondary' ? '20' : '15'}
                fill={
                  node.label === currentConcept ? '#3B82F6' :
                  node.type === 'main' ? '#10B981' :
                  node.type === 'secondary' ? '#F59E0B' : '#6B7280'
                }
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onConceptClick(node.label)}
              />
              <text
                x={`${node.x}%`}
                y={`${node.y}%`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-medium pointer-events-none"
                style={{ fontSize: node.type === 'main' ? '11px' : '9px' }}
              >
                {node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label}
              </text>
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-white rounded p-2 shadow-sm text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Main</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Secondary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Supporting</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Click on any concept to explore it. Lines show relationships between concepts.
      </p>
    </div>
  );
};

interface Explanation {
  concept: string;
  explanation: string;
  examples?: string[]; // Make optional
  relatedConcepts?: string[]; // Make optional
}

interface ConversationMessage {
  role: 'student' | 'tutor';
  content: string;
  timestamp: Date;
}

interface ConceptMapNode {
  id: string;
  label: string;
  type: 'main' | 'secondary' | 'supporting';
  description: string;
  x: number;
  y: number;
}

interface ConceptMapEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface ConceptMap {
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
}

interface LearnResponse {
  title: string;
  summary?: string; // Make optional
  explanation: string;
  keyConcepts: Explanation[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const LearnSpace: React.FC = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [learnData, setLearnData] = useState<LearnResponse | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Explanation | null>(null);
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [mapGenerating, setMapGenerating] = useState(false);
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null);

  const {
    isPromptOpen,
    currentPrompt,
    promptType,
    promptContext,
    triggerPostStudyPrompt,
    handleReflectionSubmit,
    closePrompt
  } = useMetacognitive();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
      
      // Extract text from PDF
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      
      try {
        setLoading(true);
        setError(''); // Clear previous errors
        const response = await api.post('/pdf/extract-text', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.success && response.data.data.text) {
          setText(response.data.data.text);
          setError(''); // Clear any existing errors
        } else {
          setError('Failed to extract text from PDF. The PDF might be image-based or corrupted.');
        }
      } catch (err: any) {
        console.error('PDF extraction error:', err);
        const errorMessage = err.response?.data?.message || 'Failed to extract text from PDF. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const generateExplanations = async () => {
    if (!text.trim()) {
      setError('Please provide some text or upload a PDF first.');
      return;
    }

    setLoading(true);
    setError('');
    setStudyStartTime(Date.now());
    
    try {
      console.log('Sending request to explain concept:', text.trim());
      const data = await learnAPI.explainConcept(text.trim());
      
      console.log('Received response:', data);

      if (data) {
        // Transform the response to the format the frontend expects
        const explanationData: LearnResponse = {
          title: data.concept || text.trim(),
          explanation: data.explanation || 'No explanation provided.',
          difficulty: data.difficulty || 'intermediate',
          keyConcepts: [{ 
            concept: data.concept || text.trim(),
            explanation: data.explanation || 'No explanation provided.'
          }]
        };
        
        console.log('Transformed data:', explanationData);
        setLearnData(explanationData);
        setSelectedConcept(null);
        setConversationHistory([]);
        
        // Generate concept map with the primary concept
        generateConceptMap([{ 
          concept: explanationData.title, 
          explanation: explanationData.explanation 
        }]);

        // Trigger metacognitive prompt after initial study
        setTimeout(() => {
          if (studyStartTime) {
            const timeSpent = Date.now() - studyStartTime;
            // Use our transformed data instead
            const concepts = [explanationData.title]; // Just use the main concept
            
            triggerPostStudyPrompt({
              conceptsStudied: concepts,
              timeSpent,
              studyType: 'explanation'
            });
          }
        }, 2000); // Small delay to let user absorb the content
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate explanations. Please try again.';
      setError(`Error: ${errorMsg}`);
      console.error('Learn Space error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Error message:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateConceptMap = async (concepts: Explanation[]) => {
    try {
      setMapGenerating(true);
      console.log('Generating concept map for concepts:', concepts.map(c => c.concept));
      
      const combinedText = text + '\n\n' + concepts.map(c => c.explanation).join('\n\n');
      const focusConcept = concepts.length > 0 ? concepts[0].concept : '';
      const data = await learnAPI.generateConceptMap(combinedText, focusConcept);

      if (data && data.success && data.conceptMap) {
        console.log('Concept map generated:', data.conceptMap);
        
        // Convert the response format to match our expected format
        const formattedMap: ConceptMap = {
          nodes: data.conceptMap.nodes.map((node: any) => ({
            id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            level: node.level || 1
          })),
          edges: data.conceptMap.links.map((link: any) => ({
            source: link.source,
            target: link.target,
            label: link.label || ''
          }))
        };
        
        setConceptMap(formattedMap);
        setShowConceptMap(true); // Show by default when generated
      } else {
        console.log('No concept map data received');
        createFallbackConceptMap(concepts);
      }
    } catch (err) {
      console.error('Error generating concept map:', err);
      // Create a simple fallback concept map
      createFallbackConceptMap(concepts);
    } finally {
      setMapGenerating(false);
    }
  };

  const createFallbackConceptMap = (concepts: Explanation[]) => {
    const nodes: ConceptMapNode[] = concepts.map((concept, index) => ({
      id: `concept-${index}`,
      label: concept.concept,
      type: index === 0 ? 'main' : 'secondary' as 'main' | 'secondary',
      description: concept.explanation.substring(0, 100),
      x: 30 + (index * 15),
      y: 30 + (index * 20)
    }));

    const edges: ConceptMapEdge[] = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        source: nodes[0].id,
        target: nodes[i].id,
        relationship: 'relates to',
        strength: 7
      });
    }

    setConceptMap({ nodes, edges });
    setShowConceptMap(true);
    console.log('Created fallback concept map');
  };

  const formatAIResponse = (text: string): string => {
    return text
      // Replace asterisk bullet points with proper HTML
      .replace(/\* \*\*(.*?)\*\*/g, '<strong>• $1:</strong>')
      // Replace remaining asterisks with bullet points
      .replace(/\* /g, '• ')
      // Replace **bold** with proper HTML
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Replace *italic* with proper HTML
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Handle line breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const askFollowUp = async (concept: string, question: string) => {
    if (!question.trim()) return;

    // Add student question to conversation
    const studentMessage: ConversationMessage = {
      role: 'student',
      content: question,
      timestamp: new Date()
    };
    
    const updatedHistory = [...conversationHistory, studentMessage];
    setConversationHistory(updatedHistory);

    setLoading(true);
    try {
      const contextText = concept + "\n\n" + text;
      const dialogueHistory = updatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const data = await learnAPI.socraticDialogue(question, contextText, dialogueHistory);

      if (data && data.success && selectedConcept) {
        // Add tutor response to conversation
        const tutorMessage: ConversationMessage = {
          role: 'tutor',
          content: data.response,
          timestamp: new Date()
        };
        
        const finalHistory = [...updatedHistory, tutorMessage];
        setConversationHistory(finalHistory);
        
        // Set suggested follow-up questions if provided
        if (data.suggestedFollowUps) {
          setSuggestedQuestions(data.suggestedFollowUps);
        }
      }
    } catch (err) {
      setError('Failed to get tutor guidance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Learn Space</h1>
        <p className="mt-2 text-gray-600">
          Get AI-powered explanations of concepts from your study materials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Study Material
            </h2>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
              />
              {loading && !learnData && (
                <p className="mt-2 text-sm text-blue-600">
                  📄 Extracting text from PDF...
                </p>
              )}
              {file && !loading && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {file.name} uploaded and processed
                </p>
              )}
            </div>

            <div className="mb-4">
              <span className="block text-sm font-medium text-gray-700 mb-2">
                OR
              </span>
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your study material here (textbooks, notes, articles, etc.)...

Example: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming...'"
                className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                disabled={loading}
              />
              {text && (
                <p className="mt-1 text-xs text-gray-500">
                  {text.length} characters • AI will analyze this content
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
                <div className="mt-2 flex justify-between items-center">
                  <button 
                    onClick={() => setError('')} 
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  >
                    Clear Error
                  </button>
                  <span className="text-xs text-gray-500">Check console for more details</span>
                </div>
              </div>
            )}

            <button
              onClick={generateExplanations}
              disabled={loading || !text.trim()}
              className="w-full bg-primary-600 text-white px-4 py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {loading ? 'Generating Explanations...' : 'Explain Concepts'}
            </button>
            
            {/* Debug button - remove in production */}
            <button 
              className="mb-4 w-full py-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs" 
              onClick={() => {
                console.log('Debug: Testing API connectivity');
                fetch('http://localhost:5000/api/learn/explain-concept', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    concept: 'test concept',
                    context: '',
                    difficulty: 'intermediate'
                  })
                })
                .then(response => response.json())
                .then(data => {
                  console.log('Debug: Direct fetch response:', data);
                  setError('Debug: Check console for direct API test results');
                })
                .catch(err => {
                  console.error('Debug: Direct fetch error:', err);
                  setError('Debug error: ' + err.message);
                });
              }}
            >
              Debug Test API
            </button>
            
            {/* Debug Info */}
            {learnData && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-600">
                <div>✓ Concepts: {learnData.keyConcepts.length}</div>
                <div>✓ Map: {conceptMap ? 'Generated' : mapGenerating ? 'Generating...' : 'Not generated'}</div>
                {conceptMap && (
                  <div>✓ Nodes: {conceptMap.nodes.length}, Edges: {conceptMap.edges.length}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {loading && !learnData && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
                <p className="text-gray-600">AI is analyzing your content...</p>
              </div>
            </div>
          )}

          {learnData && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{learnData.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    learnData.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    learnData.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {learnData.difficulty.charAt(0).toUpperCase() + learnData.difficulty.slice(1)}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">{learnData.summary}</p>
                
                {/* Concept Map Toggle in Overview */}
                {(conceptMap || mapGenerating) && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Concept Relationships</h3>
                      {conceptMap && !mapGenerating && (
                        <button
                          onClick={() => setShowConceptMap(!showConceptMap)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors"
                        >
                          {showConceptMap ? 'Hide' : 'Show'} Concept Map
                        </button>
                      )}
                      {mapGenerating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                          Generating map...
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Explore how concepts connect and relate to each other visually.
                    </p>
                    
                    {showConceptMap && conceptMap && !mapGenerating && (
                      <ConceptMapVisualization 
                        conceptMap={conceptMap} 
                        currentConcept=""
                        onConceptClick={(conceptName: string) => {
                          const foundConcept = learnData?.keyConcepts.find(c => 
                            c.concept.toLowerCase() === conceptName.toLowerCase()
                          );
                          if (foundConcept) {
                            setSelectedConcept(foundConcept);
                            setConversationHistory([]);
                            setSuggestedQuestions([]);
                          }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Key Concepts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learnData.keyConcepts.map((concept, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedConcept(concept);
                      setConversationHistory([]); // Reset conversation for new concept
                      setSuggestedQuestions([]);
                    }}
                    className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-primary-500"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {concept.concept}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {concept.explanation.substring(0, 120)}...
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-primary-600 font-medium">
                        Click to explore →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Concept View */}
          {selectedConcept && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedConcept.concept}
                </h3>
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="prose max-w-none mb-6">
                <div 
                  className="text-gray-700 leading-relaxed ai-response"
                  dangerouslySetInnerHTML={{ 
                    __html: formatAIResponse(selectedConcept.explanation) 
                  }}
                />
              </div>

              {selectedConcept.examples && selectedConcept.examples.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Examples</h4>
                  <ul className="space-y-2">
                    {selectedConcept.examples?.map((example, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary-500 mr-2">•</span>
                        <span className="text-gray-700">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedConcept.relatedConcepts && selectedConcept.relatedConcepts.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">Related Concepts</h4>
                    {conceptMap && (
                      <button
                        onClick={() => setShowConceptMap(!showConceptMap)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        {showConceptMap ? 'Hide' : 'Show'} Concept Map
                      </button>
                    )}
                  </div>
                  
                  {showConceptMap && conceptMap ? (
                    <ConceptMapVisualization 
                      conceptMap={conceptMap} 
                      currentConcept={selectedConcept.concept}
                      onConceptClick={(conceptName) => {
                        // Find and display the clicked concept
                        const foundConcept = learnData?.keyConcepts.find(c => 
                          c.concept.toLowerCase() === conceptName.toLowerCase()
                        );
                        if (foundConcept) {
                          setSelectedConcept(foundConcept);
                          setConversationHistory([]);
                          setSuggestedQuestions([]);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.relatedConcepts?.map((related, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-primary-100 hover:text-primary-800 transition-colors"
                          onClick={() => {
                            const foundConcept = learnData?.keyConcepts.find(c => 
                              c.concept.toLowerCase() === related.toLowerCase()
                            );
                            if (foundConcept) {
                              setSelectedConcept(foundConcept);
                              setConversationHistory([]);
                              setSuggestedQuestions([]);
                            }
                          }}
                        >
                          {related}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Concept Coach */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Concept Coach</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Engage in guided learning through questions and discovery. The AI coach will help you think critically about the concept.
                </p>
                
                {/* Conversation History */}
                {conversationHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Conversation:</h5>
                    <div className="space-y-3">
                      {conversationHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'student'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-800'
                            }`}
                          >
                            {message.role === 'student' ? (
                              <div className="text-sm">{message.content}</div>
                            ) : (
                              <div 
                                className="text-sm ai-response"
                                dangerouslySetInnerHTML={{ 
                                  __html: formatAIResponse(message.content) 
                                }}
                              />
                            )}
                            <div className={`text-xs mt-1 ${
                              message.role === 'student' ? 'text-primary-200' : 'text-gray-500'
                            }`}>
                              {message.role === 'student' ? 'You' : 'Coach'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Suggested questions:</h5>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            askFollowUp(selectedConcept.concept, suggestion);
                            setSuggestedQuestions([]);
                          }}
                          className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or share your thoughts about this concept..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        askFollowUp(selectedConcept.concept, input.value);
                        input.value = '';
                      }
                    }}
                    disabled={loading}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                      askFollowUp(selectedConcept.concept, input.value);
                      input.value = '';
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? '...' : 'Ask'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metacognitive Prompt Modal */}
      <PromptModal
        isOpen={isPromptOpen}
        onClose={closePrompt}
        onSubmit={handleReflectionSubmit}
        prompt={currentPrompt}
        promptType={promptType}
        context={promptContext}
      />
    </div>
  );
};

export default LearnSpace;
