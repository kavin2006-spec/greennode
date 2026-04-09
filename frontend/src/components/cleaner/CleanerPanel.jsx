import { useState } from 'react';
import { compressPrompt } from '../../api/greennode';
import InfoButton from '../shared/InfoButton';

export default function CleanerPanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompress() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await compressPrompt(input);
      setResult(res.data);
    } catch (e) {
      setError('Compression failed');
    } finally {
      setLoading(false);
    }
  }

  const similarityColor = result
    ? result.similarity_score >= 0.9 ? 'var(--accent-green)'
    : result.similarity_score >= 0.85 ? 'var(--accent-yellow)'
    : 'var(--accent-red)'
    : 'var(--text-secondary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            Prompt Cleaner
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
           Compress verbose prompts to reduce token count and inference emissions
          </p>
         </div>
         <InfoButton content="AI models charge per token — every unnecessary word costs money and emits CO₂. This tool strips filler phrases from your prompts and uses sentence embeddings to verify the original meaning is preserved. The similarity score tells you how close the compressed prompt is to the original — above 85% means safe to use." />
       </div>

      {/* Input area */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            original prompt
          </p>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste your verbose prompt here..."
          rows={6}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '16px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            resize: 'vertical',
            lineHeight: '1.6',
          }}
        />
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            ~{Math.max(1, Math.floor(input.length / 4))} tokens
          </span>
          <button
            onClick={handleCompress}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? 'var(--bg-card)' : 'var(--accent-green)',
              color: loading || !input.trim() ? 'var(--text-secondary)' : '#0f1117',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'compressing...' : '⚡ compress'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          ⚠ {error}
        </p>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Tokens Saved', value: result.tokens_saved, unit: 'tokens', accent: true },
              { label: 'Compression', value: `${((1 - result.compression_ratio) * 100).toFixed(0)}`, unit: '%' },
              { label: 'CO₂ Saved', value: result.estimated_co2_saved_g.toFixed(4), unit: 'g' },
              { label: 'Water Saved', value: result.estimated_water_saved_ml.toFixed(4), unit: 'ml' },
            ].map(({ label, value, unit, accent }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: accent ? '3px solid var(--accent-green)' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '20px 24px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '8px'
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '24px',
                  color: accent ? 'var(--accent-green)' : 'var(--text-primary)',
                  fontWeight: '500',
                }}>
                  {value}
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Similarity + intent */}
          <div style={{
            background: result.intent_preserved ? 'var(--accent-green-dim)' : 'rgba(255,77,109,0.08)',
            border: `1px solid ${result.intent_preserved ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            borderRadius: '8px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {result.tokens_saved === 0 && (
              <div style={{
                background: 'rgba(255,209,102,0.08)',
                border: '1px solid var(--accent-yellow)',
                borderRadius: '8px',
                padding: '14px 20px',
             }}>
               <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--accent-yellow)'
             }}>
               ⓘ no filler phrases detected — prompt is already concise
               </p>
            </div>
             )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{result.intent_preserved ? '✓' : '⚠'}</span>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: result.intent_preserved ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                intent {result.intent_preserved ? 'preserved' : 'at risk — review before using'}
              </p>
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: similarityColor
            }}>
              similarity: {(result.similarity_score * 100).toFixed(1)}%
            </p>
          </div>

          {/* Compressed output */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                compressed prompt
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(result.compressed_text)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                copy
              </button>
            </div>
            <p style={{
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
            }}>
              {result.compressed_text}
            </p>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}>
                ~{result.compressed_tokens} tokens
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}