import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface Document {
  id: string;
  name: string;
  text: string;
}

interface Answer {
  docId: string;
  answer: string;
  citation: string;
}

const Home: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('http://127.0.0.1:8000/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setDocs(prev => [
          ...prev,
          { id: `${Date.now()}-${i}`, name: file.name, text: data.text }
        ]);
      } catch (err) {
        console.error(err);
      }
    }
    setLoading(false);
  };

  const handleQuestion = async () => {
    if (!question.trim() || docs.length === 0) return;
    setLoading(true);

    const payload = {
      question,
      documents: docs.map(d => ({ id: d.id, text: d.text }))
    };

    const res = await fetch('http://127.0.0.1:8000/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: Answer[] = await res.json();
    setAnswers(data);
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Answer copied to clipboard!');
  };

  const handleDownload = (text: string, name: string, format: 'txt' | 'pdf') => {
    if (format === 'txt') {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.txt`;
      link.click();
    } else {
      const doc = new jsPDF();
      doc.text(text, 10, 10);
      doc.save(`${name}.pdf`);
    }
  };

  const handleReset = () => {
    setDocs([]);
    setAnswers([]);
    setQuestion('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center text-indigo-700">📚 Multi‑Document Q&A</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <label className="font-semibold">Upload Documents:</label>
        <input
          type="file"
          accept=".txt,.pdf"
          multiple
          onChange={handleFilesUpload}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-100 file:text-indigo-800"
        />
        <button
          onClick={handleReset}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          🔄 Reset
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Uploaded Documents:</h2>
        {docs.length === 0 ? (
          <p className="text-gray-500 italic">No documents uploaded.</p>
        ) : (
          <div className="h-60 overflow-y-auto border rounded-lg shadow-inner bg-white p-2">
            <ul className="space-y-2">
              {docs.map(doc => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded shadow-sm"
                >
                  <span className="text-gray-800 break-words">{doc.name}</span>
                  <button
                    onClick={() => setDocs(prev => prev.filter(d => d.id !== doc.id))}
                    className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    🗑️ Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>



      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Ask a Question:</h2>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring"
          placeholder="Type your question here..."
        />
        <button
          onClick={handleQuestion}
          disabled={loading}
          className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
        >
          ❓ Ask
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-gray-600 animate-pulse">⏳ Processing...</div>
      )}

      {answers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Answers:</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Document</th>
                <th className="border px-4 py-2">Answer</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((ans, idx) => {
                const docName = docs.find(d => d.id === ans.docId)?.name || 'Unknown';
                const combinedText = `Answer: ${ans.answer}\nCitation: ${ans.citation}`;
                return (
                  <tr key={idx}>
                    <td className="border px-4 py-2">{docName}</td>
                    <td className="border px-4 py-2 whitespace-pre-wrap">{combinedText}</td>
                    <td className="border px-4 py-2 space-x-2 gap-4 flex">
                      <button
                        onClick={() => handleCopy(combinedText)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => handleDownload(combinedText, docName, 'txt')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        ⬇ TXT
                      </button>
                      <button
                        onClick={() => handleDownload(combinedText, docName, 'pdf')}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded"
                      >
                        ⬇ PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Home;
