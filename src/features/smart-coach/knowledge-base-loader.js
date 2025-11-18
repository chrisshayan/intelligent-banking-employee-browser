const fs = require('fs');
const path = require('path');
const smartCoachService = require('./smart-coach-service');

/**
 * Load and index knowledge base documents
 */

/**
 * Load knowledge base from directory
 * @param {string} directory - Directory containing knowledge base files
 */
async function loadKnowledgeBase(directory) {
  const knowledgeBasePath = path.resolve(directory);
  
  if (!fs.existsSync(knowledgeBasePath)) {
    console.warn(`Knowledge base directory not found: ${knowledgeBasePath}`);
    return {
      loaded: false,
      error: 'Directory not found'
    };
  }

  const files = fs.readdirSync(knowledgeBasePath);
  const textFiles = files.filter(f => 
    f.endsWith('.txt') || 
    f.endsWith('.md') || 
    f.endsWith('.json')
  );

  const documents = [];
  const metadata = [];

  for (const file of textFiles) {
    try {
      const filePath = path.join(knowledgeBasePath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      documents.push(content);
      metadata.push({
        source: file,
        path: filePath,
        type: path.extname(file).substring(1),
        size: content.length,
        loadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error loading file ${file}:`, error);
    }
  }

  if (documents.length === 0) {
    return {
      loaded: false,
      error: 'No documents found'
    };
  }

  // Index documents
  const result = await smartCoachService.indexKnowledgeBase(documents, metadata);

  return {
    loaded: true,
    filesLoaded: documents.length,
    chunksIndexed: result.chunksIndexed,
    totalChunks: result.totalChunks
  };
}

/**
 * Load default knowledge base (sample documents)
 */
async function loadDefaultKnowledgeBase() {
  // Create sample knowledge base documents
  const sampleDocuments = [
    {
      text: `# Product: Premium Savings Account

## Overview
The Premium Savings Account is designed for high-net-worth individuals seeking competitive interest rates with flexible access to funds.

## Eligibility
- Minimum balance: $10,000
- Monthly maintenance fee: $25 (waived if balance > $50,000)
- Interest rate: 2.5% APY

## Features
- Unlimited transactions
- Free ATM withdrawals
- Priority customer service
- Mobile banking access`,
      metadata: {
        source: 'premium-savings-account.md',
        type: 'product',
        category: 'savings'
      }
    },
    {
      text: `# Compliance: KYC Requirements

## Customer Identification
All new customers must provide:
1. Government-issued photo ID
2. Proof of address (utility bill, bank statement)
3. Tax identification number

## Verification Process
- Documents must be verified within 24 hours
- High-risk customers require additional verification
- All verification must be documented in the system`,
      metadata: {
        source: 'kyc-requirements.md',
        type: 'compliance',
        category: 'kyc'
      }
    },
    {
      text: `# Segmentation: Customer Tiers

## Tier 1: Premium
- Balance: > $100,000
- Benefits: Dedicated relationship manager, premium rates, exclusive events

## Tier 2: Standard
- Balance: $10,000 - $100,000
- Benefits: Standard rates, online support

## Tier 3: Basic
- Balance: < $10,000
- Benefits: Basic services, self-service options`,
      metadata: {
        source: 'customer-segmentation.md',
        type: 'segmentation',
        category: 'tiers'
      }
    }
  ];

  const texts = sampleDocuments.map(d => d.text);
  const metadata = sampleDocuments.map(d => d.metadata);

  const result = await smartCoachService.indexKnowledgeBase(texts, metadata);

  return {
    loaded: true,
    filesLoaded: texts.length,
    chunksIndexed: result.chunksIndexed,
    totalChunks: result.totalChunks
  };
}

module.exports = {
  loadKnowledgeBase,
  loadDefaultKnowledgeBase
};

