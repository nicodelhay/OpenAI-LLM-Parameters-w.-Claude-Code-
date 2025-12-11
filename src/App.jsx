import React, { useState, useEffect } from 'react';

const PARAMETERS = [
  {
    id: 'temperature',
    name: 'Sampling Temperature',
    category: 'generation',
    type: 'slider',
    min: 0,
    max: 2,
    step: 0.1,
    default: 1,
    unit: '',
    shortDesc: 'Niveau de créativité / hasard',
    fullDesc: 'Contrôle l\'aléatoire dans la génération. À 0, le modèle est déterministe et choisit toujours le token le plus probable. Plus la valeur augmente, plus les réponses deviennent variées et créatives, mais aussi potentiellement incohérentes.',
    examples: [
      { value: 0, effect: 'Réponses prévisibles, idéal pour du code ou des faits' },
      { value: 0.7, effect: 'Bon équilibre créativité/cohérence' },
      { value: 1.5, effect: 'Très créatif, peut dériver' }
    ],
    icon: '🎲'
  },
  {
    id: 'top_p',
    name: 'Top P (Nucleus Sampling)',
    category: 'generation',
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.05,
    default: 1,
    unit: '',
    shortDesc: 'Filtre les tokens par probabilité cumulée',
    fullDesc: 'Ne considère que les tokens dont la probabilité cumulée atteint p. À 0.1, seuls les tokens représentant 10% de la masse de probabilité sont considérés. Alternative à temperature pour contrôler la diversité.',
    examples: [
      { value: 0.1, effect: 'Très restrictif, réponses conservatrices' },
      { value: 0.9, effect: 'Large éventail, bonne diversité' },
      { value: 1, effect: 'Aucun filtrage (tous les tokens possibles)' }
    ],
    icon: '🎯'
  },
  {
    id: 'presence_penalty',
    name: 'Presence Penalty',
    category: 'generation',
    type: 'slider',
    min: -2,
    max: 2,
    step: 0.1,
    default: 0,
    unit: '',
    shortDesc: 'Pénalise les tokens déjà apparus',
    fullDesc: 'Applique une pénalité fixe à chaque token déjà utilisé au moins une fois. Pousse le modèle à explorer de nouveaux sujets et éviter les répétitions thématiques. Valeurs négatives encouragent la répétition.',
    examples: [
      { value: -1, effect: 'Encourage la répétition de termes clés' },
      { value: 0, effect: 'Comportement neutre' },
      { value: 1.5, effect: 'Force l\'exploration de nouveaux sujets' }
    ],
    icon: '🚫'
  },
  {
    id: 'max_tokens',
    name: 'Maximum Tokens',
    category: 'limits',
    type: 'number',
    min: 1,
    max: 128000,
    step: 100,
    default: 4096,
    unit: 'tokens',
    shortDesc: 'Longueur maximale de la réponse',
    fullDesc: 'Limite le nombre de tokens que le modèle peut générer. Un token ≈ 4 caractères en anglais, ~3 en français. Impacte directement le coût (facturation au token) et le temps de réponse.',
    examples: [
      { value: 100, effect: '~75 mots, réponse très courte' },
      { value: 1000, effect: '~750 mots, paragraphe développé' },
      { value: 4096, effect: '~3000 mots, réponse détaillée' }
    ],
    icon: '📏'
  },
  {
    id: 'response_format',
    name: 'Response Format',
    category: 'output',
    type: 'select',
    options: ['text', 'json_object', 'json_schema'],
    default: 'text',
    shortDesc: 'Format de sortie structuré',
    fullDesc: 'Force le modèle à produire une sortie dans un format spécifique. "json_object" garantit un JSON valide. "json_schema" permet de définir un schéma précis que la réponse doit respecter.',
    examples: [
      { value: 'text', effect: 'Texte libre, format naturel' },
      { value: 'json_object', effect: 'JSON valide garanti' },
      { value: 'json_schema', effect: 'JSON conforme à un schéma défini' }
    ],
    icon: '📋'
  },
  {
    id: 'reasoning_effort',
    name: 'Reasoning Effort',
    category: 'reasoning',
    type: 'select',
    options: ['low', 'medium', 'high'],
    default: 'medium',
    shortDesc: 'Intensité de la réflexion interne',
    fullDesc: 'Contrôle l\'effort de raisonnement du modèle (pour les modèles o1/o3). "high" produit des réponses plus réfléchies mais plus lentes et coûteuses. Utile pour des problèmes complexes nécessitant une analyse approfondie.',
    examples: [
      { value: 'low', effect: 'Rapide, pour questions simples' },
      { value: 'medium', effect: 'Équilibre standard' },
      { value: 'high', effect: 'Réflexion approfondie, problèmes complexes' }
    ],
    icon: '🧠'
  },
  {
    id: 'timeout',
    name: 'Timeout',
    category: 'network',
    type: 'number',
    min: 1,
    max: 600,
    step: 1,
    default: 60,
    unit: 'secondes',
    shortDesc: 'Délai max avant interruption',
    fullDesc: 'Temps maximum d\'attente pour une réponse avant d\'annuler la requête. Important pour éviter les blocages en production. Doit être ajusté selon max_tokens et reasoning_effort.',
    examples: [
      { value: 10, effect: 'Réponses courtes uniquement' },
      { value: 60, effect: 'Standard, convient à la plupart des cas' },
      { value: 300, effect: 'Analyses longues, reasoning élevé' }
    ],
    icon: '⏱️'
  },
  {
    id: 'max_retries',
    name: 'Max Retries',
    category: 'network',
    type: 'number',
    min: 0,
    max: 10,
    step: 1,
    default: 2,
    unit: 'tentatives',
    shortDesc: 'Tentatives en cas d\'erreur réseau',
    fullDesc: 'Nombre de réessais automatiques en cas d\'erreur temporaire (429 rate limit, 500 serveur, timeout). Avec backoff exponentiel généralement. Évite les échecs sur des problèmes transitoires.',
    examples: [
      { value: 0, effect: 'Aucun réessai, échec immédiat' },
      { value: 2, effect: 'Standard, robuste aux erreurs passagères' },
      { value: 5, effect: 'Très résilient, mais latence potentielle' }
    ],
    icon: '🔄'
  },
  {
    id: 'conversation_id',
    name: 'Conversation ID',
    category: 'context',
    type: 'text',
    default: '',
    shortDesc: 'Identifiant de fil de conversation',
    fullDesc: 'Identifiant unique pour relier plusieurs appels à une même conversation. Permet de maintenir le contexte entre les requêtes sans renvoyer tout l\'historique. Géré côté client ou via l\'API Assistants.',
    examples: [
      { value: 'conv_abc123', effect: 'Lie les messages à une session' },
      { value: '', effect: 'Chaque appel est indépendant' }
    ],
    icon: '💬'
  },
  {
    id: 'prompt_cache_key',
    name: 'Prompt Cache Key',
    category: 'optimization',
    type: 'text',
    default: '',
    shortDesc: 'Clé de cache pour prompts récurrents',
    fullDesc: 'Permet de réutiliser un prompt système déjà traité par OpenAI. Réduit la latence (pas de re-tokenisation) et les coûts si le même préfixe est utilisé fréquemment. Économies significatives sur les gros prompts système.',
    examples: [
      { value: 'sys_v1_finance', effect: 'Réutilise le prompt système finance' },
      { value: '', effect: 'Pas de cache, traitement complet' }
    ],
    icon: '💾'
  },
  {
    id: 'service_tier',
    name: 'Service Tier',
    category: 'infra',
    type: 'select',
    options: ['auto', 'default', 'flex'],
    default: 'auto',
    shortDesc: 'Niveau de priorité/latence',
    fullDesc: 'Définit la priorité de traitement. "default" = file standard. "flex" = batch processing moins cher mais plus lent. Certains plans offrent des tiers prioritaires avec latence garantie.',
    examples: [
      { value: 'auto', effect: 'OpenAI choisit selon la charge' },
      { value: 'default', effect: 'Latence standard' },
      { value: 'flex', effect: 'Batch, -50% coût, latence variable' }
    ],
    icon: '⚡'
  },
  {
    id: 'metadata',
    name: 'Metadata',
    category: 'tracking',
    type: 'json',
    default: '{}',
    shortDesc: 'Données de suivi personnalisées',
    fullDesc: 'Objet JSON libre pour ajouter vos propres données de tracking (user_id, use_case, version, etc.). Retourné dans les réponses et visible dans les logs OpenAI. Utile pour l\'analytics et le débogage.',
    examples: [
      { value: '{"user": "n.dupont", "env": "prod"}', effect: 'Tracking utilisateur + environnement' },
      { value: '{"cost_center": "trading"}', effect: 'Attribution comptable' }
    ],
    icon: '🏷️'
  },
  {
    id: 'safety_identifier',
    name: 'Safety Identifier',
    category: 'tracking',
    type: 'text',
    default: '',
    shortDesc: 'Tag pour modération/sécurité',
    fullDesc: 'Identifiant pour le système de modération d\'OpenAI. Permet d\'appliquer des règles de sécurité spécifiques ou de tracer les requêtes à des fins de conformité. Principalement pour intégrations enterprise.',
    examples: [
      { value: 'client_facing_v2', effect: 'Règles strictes pour public' },
      { value: 'internal_dev', effect: 'Règles assouplies pour dev' }
    ],
    icon: '🛡️'
  }
];

const CATEGORIES = {
  generation: { name: 'Génération', color: '#6366f1', desc: 'Contrôle du comportement créatif' },
  limits: { name: 'Limites', color: '#f59e0b', desc: 'Contraintes de taille et durée' },
  output: { name: 'Sortie', color: '#10b981', desc: 'Format des réponses' },
  reasoning: { name: 'Raisonnement', color: '#ec4899', desc: 'Profondeur de réflexion' },
  network: { name: 'Réseau', color: '#8b5cf6', desc: 'Gestion des erreurs et timeouts' },
  context: { name: 'Contexte', color: '#06b6d4', desc: 'Gestion des conversations' },
  optimization: { name: 'Optimisation', color: '#84cc16', desc: 'Performance et coûts' },
  infra: { name: 'Infrastructure', color: '#f97316', desc: 'Niveau de service' },
  tracking: { name: 'Tracking', color: '#64748b', desc: 'Suivi et métadonnées' }
};

const QUIZ_QUESTIONS = [
  { q: 'Quel paramètre contrôle le niveau de créativité ?', a: 'temperature', hint: 'Pense à un dé 🎲' },
  { q: 'Comment limiter la longueur d\'une réponse ?', a: 'max_tokens', hint: 'Unité de mesure du texte' },
  { q: 'Quel paramètre force le modèle à explorer de nouveaux sujets ?', a: 'presence_penalty', hint: 'Pénalise ce qui existe déjà' },
  { q: 'Comment garantir une sortie JSON valide ?', a: 'response_format', hint: 'Format de la réponse' },
  { q: 'Quel paramètre utilise le "nucleus sampling" ?', a: 'top_p', hint: 'Probabilité cumulée' },
  { q: 'Comment augmenter la réflexion du modèle o1 ?', a: 'reasoning_effort', hint: '🧠' },
  { q: 'Quel paramètre gère les réessais automatiques ?', a: 'max_retries', hint: 'En cas d\'erreur réseau' },
  { q: 'Comment réduire les coûts sur des prompts répétitifs ?', a: 'prompt_cache_key', hint: 'Réutilisation' },
  { q: 'Quel paramètre permet le batch processing économique ?', a: 'service_tier', hint: 'Niveau de service' },
  { q: 'Où ajouter un user_id pour le tracking ?', a: 'metadata', hint: 'Données personnalisées' }
];

export default function LLMParamsLearner() {
  const [mode, setMode] = useState('explore'); // explore, quiz, sandbox
  const [selectedParam, setSelectedParam] = useState(null);
  const [values, setValues] = useState(() => {
    const initial = {};
    PARAMETERS.forEach(p => { initial[p.id] = p.default; });
    return initial;
  });
  const [quizState, setQuizState] = useState({ index: 0, score: 0, answered: false, wrong: false });
  const [filterCategory, setFilterCategory] = useState('all');
  const [showExamples, setShowExamples] = useState(true);
  const [learned, setLearned] = useState(() => new Set());
  
  const filteredParams = filterCategory === 'all' 
    ? PARAMETERS 
    : PARAMETERS.filter(p => p.category === filterCategory);

  const handleValueChange = (id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const markAsLearned = (id) => {
    setLearned(prev => new Set([...prev, id]));
  };

  const handleQuizAnswer = (answerId) => {
    const correct = answerId === QUIZ_QUESTIONS[quizState.index].a;
    setQuizState(prev => ({
      ...prev,
      answered: true,
      wrong: !correct,
      score: correct ? prev.score + 1 : prev.score
    }));
  };

  const nextQuestion = () => {
    setQuizState(prev => ({
      index: (prev.index + 1) % QUIZ_QUESTIONS.length,
      score: prev.index === QUIZ_QUESTIONS.length - 1 ? 0 : prev.score,
      answered: false,
      wrong: false
    }));
  };

  const renderControl = (param) => {
    const value = values[param.id];
    
    switch (param.type) {
      case 'slider':
        return (
          <div className="control-slider">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={value}
              onChange={(e) => handleValueChange(param.id, parseFloat(e.target.value))}
            />
            <span className="value-display">{value}{param.unit && ` ${param.unit}`}</span>
          </div>
        );
      case 'number':
        return (
          <div className="control-number">
            <input
              type="number"
              min={param.min}
              max={param.max}
              step={param.step}
              value={value}
              onChange={(e) => handleValueChange(param.id, parseInt(e.target.value) || param.min)}
            />
            {param.unit && <span className="unit">{param.unit}</span>}
          </div>
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(param.id, e.target.value)}
            className="control-select"
          >
            {param.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'text':
      case 'json':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(param.id, e.target.value)}
            placeholder={param.type === 'json' ? '{"key": "value"}' : 'Identifiant...'}
            className="control-text"
          />
        );
      default:
        return null;
    }
  };

  const progress = (learned.size / PARAMETERS.length) * 100;

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          color: #e2e8f0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 24px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
        }
        
        .header h1 {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .header .subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
        }
        
        .progress-bar {
          margin-top: 16px;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #ec4899);
          transition: width 0.5s ease;
          border-radius: 3px;
        }
        
        .progress-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 6px;
        }
        
        .mode-tabs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .mode-tab {
          padding: 10px 24px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: #94a3b8;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .mode-tab:hover {
          background: rgba(255,255,255,0.1);
          color: #e2e8f0;
        }
        
        .mode-tab.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        
        .category-filters {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-bottom: 24px;
        }
        
        .category-chip {
          padding: 6px 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #94a3b8;
          border-radius: 20px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }
        
        .category-chip:hover {
          border-color: rgba(255,255,255,0.3);
          color: #e2e8f0;
        }
        
        .category-chip.active {
          border-color: currentColor;
          background: currentColor;
          color: white;
        }
        
        .params-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .param-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .param-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--cat-color);
          opacity: 0.7;
        }
        
        .param-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        
        .param-card.selected {
          border-color: var(--cat-color);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
        }
        
        .param-card.learned {
          background: rgba(16, 185, 129, 0.05);
        }
        
        .param-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .param-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .param-title-group {
          flex: 1;
          min-width: 0;
        }
        
        .param-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.95rem;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 4px;
        }
        
        .param-short {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.4;
        }
        
        .param-category-badge {
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--cat-color);
          color: white;
          font-weight: 500;
          opacity: 0.9;
        }
        
        .param-control {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        
        .control-slider {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .control-slider input[type="range"] {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          outline: none;
        }
        
        .control-slider input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }
        
        .value-display {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: #8b5cf6;
          min-width: 60px;
          text-align: right;
        }
        
        .control-number {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-number input,
        .control-text,
        .control-select {
          flex: 1;
          padding: 10px 14px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .control-number input:focus,
        .control-text:focus,
        .control-select:focus {
          border-color: #6366f1;
        }
        
        .control-select {
          cursor: pointer;
        }
        
        .unit {
          color: #64748b;
          font-size: 0.8rem;
        }
        
        .param-examples {
          margin-top: 12px;
          padding: 12px;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
        }
        
        .example-item {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .example-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .example-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #6366f1;
          min-width: 80px;
          flex-shrink: 0;
        }
        
        .example-effect {
          font-size: 0.8rem;
          color: #94a3b8;
          line-height: 1.4;
        }
        
        .learn-btn {
          margin-top: 12px;
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 8px;
          color: white;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .learn-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        
        .learn-btn.learned {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        /* Detail Panel */
        .detail-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 420px;
          background: linear-gradient(180deg, #1e1e2f 0%, #16162a 100%);
          border-left: 1px solid rgba(255,255,255,0.1);
          padding: 32px;
          overflow-y: auto;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 100;
        }
        
        .detail-panel.open {
          transform: translateX(0);
        }
        
        .detail-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #94a3b8;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .detail-close:hover {
          background: rgba(255,255,255,0.15);
          color: white;
        }
        
        .detail-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        
        .detail-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.3rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
        }
        
        .detail-desc {
          font-size: 0.95rem;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        
        .detail-section {
          margin-bottom: 24px;
        }
        
        .detail-section h4 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
          margin-bottom: 12px;
        }
        
        /* Quiz Mode */
        .quiz-container {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        
        .quiz-score {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.2rem;
          color: #6366f1;
          margin-bottom: 32px;
        }
        
        .quiz-question {
          font-size: 1.3rem;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .quiz-hint {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 32px;
        }
        
        .quiz-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .quiz-option {
          padding: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quiz-option:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
        
        .quiz-option.correct {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          color: #10b981;
        }
        
        .quiz-option.wrong {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .quiz-next {
          margin-top: 32px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 10px;
          color: white;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quiz-next:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        
        /* Sandbox */
        .sandbox-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .sandbox-preview {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        
        .sandbox-preview h3 {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 12px;
        }
        
        .sandbox-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #e2e8f0;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        
        .sandbox-code .key {
          color: #6366f1;
        }
        
        .sandbox-code .value {
          color: #10b981;
        }
        
        .sandbox-code .string {
          color: #f59e0b;
        }
        
        @media (max-width: 768px) {
          .app {
            padding: 16px;
          }
          
          .params-grid {
            grid-template-columns: 1fr;
          }
          
          .detail-panel {
            width: 100%;
          }
          
          .quiz-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="header">
        <h1>🧪 LLM Parameters Lab</h1>
        <p className="subtitle">Maîtrise les paramètres de l'API OpenAI</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progress-text">{learned.size}/{PARAMETERS.length} paramètres maîtrisés</p>
      </header>

      <div className="mode-tabs">
        <button 
          className={`mode-tab ${mode === 'explore' ? 'active' : ''}`}
          onClick={() => setMode('explore')}
        >
          📚 Explorer
        </button>
        <button 
          className={`mode-tab ${mode === 'quiz' ? 'active' : ''}`}
          onClick={() => setMode('quiz')}
        >
          🎯 Quiz
        </button>
        <button 
          className={`mode-tab ${mode === 'sandbox' ? 'active' : ''}`}
          onClick={() => setMode('sandbox')}
        >
          🛠️ Sandbox
        </button>
      </div>

      {mode === 'explore' && (
        <>
          <div className="category-filters">
            <button
              className={`category-chip ${filterCategory === 'all' ? 'active' : ''}`}
              style={{ '--chip-color': '#6366f1' }}
              onClick={() => setFilterCategory('all')}
            >
              Tous ({PARAMETERS.length})
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                className={`category-chip ${filterCategory === key ? 'active' : ''}`}
                style={{ color: cat.color, borderColor: filterCategory === key ? cat.color : undefined }}
                onClick={() => setFilterCategory(key)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="params-grid">
            {filteredParams.map(param => (
              <div
                key={param.id}
                className={`param-card ${selectedParam?.id === param.id ? 'selected' : ''} ${learned.has(param.id) ? 'learned' : ''}`}
                style={{ '--cat-color': CATEGORIES[param.category].color }}
                onClick={() => setSelectedParam(param)}
              >
                <div className="param-header">
                  <div className="param-icon">{param.icon}</div>
                  <div className="param-title-group">
                    <div className="param-name">{param.name}</div>
                    <div className="param-short">{param.shortDesc}</div>
                  </div>
                  <span className="param-category-badge" style={{ background: CATEGORIES[param.category].color }}>
                    {CATEGORIES[param.category].name}
                  </span>
                </div>
                
                <div className="param-control">
                  {renderControl(param)}
                </div>

                {showExamples && param.examples && (
                  <div className="param-examples">
                    {param.examples.map((ex, i) => (
                      <div key={i} className="example-item">
                        <span className="example-value">{String(ex.value)}</span>
                        <span className="example-effect">{ex.effect}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className={`learn-btn ${learned.has(param.id) ? 'learned' : ''}`}
                  onClick={(e) => { e.stopPropagation(); markAsLearned(param.id); }}
                >
                  {learned.has(param.id) ? '✓ Maîtrisé' : 'Marquer comme appris'}
                </button>
              </div>
            ))}
          </div>

          <div className={`detail-panel ${selectedParam ? 'open' : ''}`}>
            {selectedParam && (
              <>
                <button className="detail-close" onClick={() => setSelectedParam(null)}>×</button>
                <div className="detail-icon">{selectedParam.icon}</div>
                <h2 className="detail-name">{selectedParam.name}</h2>
                <p className="detail-desc">{selectedParam.fullDesc}</p>
                
                <div className="detail-section">
                  <h4>Catégorie</h4>
                  <span 
                    className="param-category-badge" 
                    style={{ background: CATEGORIES[selectedParam.category].color }}
                  >
                    {CATEGORIES[selectedParam.category].name}
                  </span>
                  <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#94a3b8' }}>
                    {CATEGORIES[selectedParam.category].desc}
                  </p>
                </div>

                <div className="detail-section">
                  <h4>Contrôle interactif</h4>
                  {renderControl(selectedParam)}
                </div>

                {selectedParam.examples && (
                  <div className="detail-section">
                    <h4>Exemples d'utilisation</h4>
                    <div className="param-examples">
                      {selectedParam.examples.map((ex, i) => (
                        <div key={i} className="example-item">
                          <span className="example-value">{String(ex.value)}</span>
                          <span className="example-effect">{ex.effect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {mode === 'quiz' && (
        <div className="quiz-container">
          <div className="quiz-score">
            Score : {quizState.score} / {QUIZ_QUESTIONS.length}
          </div>
          
          <p className="quiz-question">{QUIZ_QUESTIONS[quizState.index].q}</p>
          <p className="quiz-hint">💡 Indice : {QUIZ_QUESTIONS[quizState.index].hint}</p>
          
          <div className="quiz-options">
            {PARAMETERS
              .sort(() => Math.random() - 0.5)
              .slice(0, 4)
              .concat(PARAMETERS.find(p => p.id === QUIZ_QUESTIONS[quizState.index].a) || [])
              .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
              .slice(0, 4)
              .map(param => (
                <button
                  key={param.id}
                  className={`quiz-option ${
                    quizState.answered && param.id === QUIZ_QUESTIONS[quizState.index].a ? 'correct' : ''
                  } ${
                    quizState.wrong && quizState.answered && param.id !== QUIZ_QUESTIONS[quizState.index].a ? 'wrong' : ''
                  }`}
                  onClick={() => !quizState.answered && handleQuizAnswer(param.id)}
                  disabled={quizState.answered}
                >
                  {param.icon} {param.name}
                </button>
              ))}
          </div>

          {quizState.answered && (
            <button className="quiz-next" onClick={nextQuestion}>
              Question suivante →
            </button>
          )}
        </div>
      )}

      {mode === 'sandbox' && (
        <div className="sandbox-container">
          <div className="sandbox-preview">
            <h3>📄 Configuration actuelle (JSON)</h3>
            <div className="sandbox-code">
{`{
  `}<span className="key">"model"</span>: <span className="string">"gpt-4o"</span>,{`
  `}<span className="key">"temperature"</span>: <span className="value">{values.temperature}</span>,{`
  `}<span className="key">"top_p"</span>: <span className="value">{values.top_p}</span>,{`
  `}<span className="key">"presence_penalty"</span>: <span className="value">{values.presence_penalty}</span>,{`
  `}<span className="key">"max_tokens"</span>: <span className="value">{values.max_tokens}</span>,{`
  `}<span className="key">"response_format"</span>: <span className="string">"{values.response_format}"</span>,{`
  `}<span className="key">"timeout"</span>: <span className="value">{values.timeout}</span>,{`
  `}<span className="key">"max_retries"</span>: <span className="value">{values.max_retries}</span>{values.metadata !== '{}' ? `,
  `+<span className="key">"metadata"</span>+`: `+values.metadata : ''}{`
}`}
            </div>
          </div>

          <div className="params-grid">
            {PARAMETERS.filter(p => ['temperature', 'top_p', 'presence_penalty', 'max_tokens'].includes(p.id)).map(param => (
              <div
                key={param.id}
                className="param-card"
                style={{ '--cat-color': CATEGORIES[param.category].color }}
              >
                <div className="param-header">
                  <div className="param-icon">{param.icon}</div>
                  <div className="param-title-group">
                    <div className="param-name">{param.name}</div>
                  </div>
                </div>
                <div className="param-control">
                  {renderControl(param)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
