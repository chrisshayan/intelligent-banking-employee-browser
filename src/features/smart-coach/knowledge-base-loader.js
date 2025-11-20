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
  // Create comprehensive knowledge base documents
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
      text: `# Product: Certificate of Deposit (CD)

## Overview
Certificates of Deposit (CDs) are time-deposit accounts that offer fixed interest rates for a specified term. CDs provide guaranteed returns and are FDIC insured.

## Types of CDs
- Standard CD: Terms from 3 months to 5 years, minimum deposit $1,000
- Jumbo CD: Terms from 6 months to 5 years, minimum deposit $100,000, higher rates
- Bump-up CD: Option to increase rate once during term
- No-penalty CD: Can withdraw early without penalty

## Interest Rates (as of 2024)
- 3-month CD: 2.0% APY
- 6-month CD: 2.5% APY
- 1-year CD: 3.0% APY
- 2-year CD: 3.5% APY
- 5-year CD: 4.0% APY

## Customer Reminders
- CD maturity notices are sent 30 days before maturity date
- Customers can renew, withdraw, or change terms at maturity
- Early withdrawal penalties: 3 months interest for terms < 1 year, 6 months interest for terms >= 1 year`,
      metadata: {
        source: 'certificate-of-deposit.md',
        type: 'product',
        category: 'deposits'
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
      text: `# Segmentation: Customer Tiers and HIFI Segment

## Tier 1: Premium
- Balance: > $100,000
- Benefits: Dedicated relationship manager, premium rates, exclusive events

## Tier 2: Standard
- Balance: $10,000 - $100,000
- Benefits: Standard rates, online support

## Tier 3: Basic
- Balance: < $10,000
- Benefits: Basic services, self-service options

## High-Income Financial Individuals (HIFI) Segment

### Definition
HIFI customers are high-net-worth individuals with:
- Annual income > $200,000
- Investable assets > $500,000
- Complex financial needs requiring personalized service

### Customer Value Profit (CVP)
The HIFI segment generates significant Customer Value Profit through:
- Higher average balances across all account types
- Premium product adoption (85% use multiple products)
- Lower churn rate (2% annually vs 8% for standard customers)
- Referral value (average 2.3 referrals per customer)
- Cross-sell success rate: 3.2 products per customer

### CVP Metrics (2024)
- Average revenue per customer: $2,400/year
- Average cost to serve: $800/year
- Net CVP per customer: $1,600/year
- Segment size: 12,500 customers
- Total segment CVP: $20M annually

### Service Model
- Dedicated relationship managers (1:50 ratio)
- Priority service channels
- Exclusive product access
- Personalized financial planning`,
      metadata: {
        source: 'customer-segmentation.md',
        type: 'segmentation',
        category: 'tiers'
      }
    },
    {
      text: `# Strategy: 2025 Business Plan

## Strategic Objectives for 2025

### 1. Digital Transformation
- Complete migration to cloud-based core banking by Q2 2025
- Launch new mobile banking app with AI-powered features
- Implement real-time transaction processing
- Target: 40% reduction in processing time

### 2. Customer Growth
- Acquire 25,000 new customers in 2025
- Focus on HIFI segment growth (target: +15% segment size)
- Expand into new geographic markets (3 new regions)
- Target: $500M in new deposits

### 3. Product Innovation
- Launch AI-powered investment advisory service
- Introduce sustainable banking products (ESG-focused)
- Develop embedded banking solutions for fintech partnerships
- Target: 5 new product launches in 2025

### 4. Operational Excellence
- Reduce customer service wait times by 50%
- Achieve 99.9% system uptime
- Implement predictive analytics for risk management
- Target: 20% reduction in operational costs

### 5. Technology & Innovation
- Deploy edge AI for real-time fraud detection
- Implement blockchain for secure document management
- Enhance cybersecurity infrastructure
- Target: Zero security incidents

## Key Performance Indicators (KPIs)
- Customer satisfaction: > 4.5/5.0
- Net Promoter Score: > 60
- Digital adoption rate: > 80%
- Revenue growth: 15% YoY
- Profit margin: > 25%`,
      metadata: {
        source: '2025-strategy.md',
        type: 'strategy',
        category: 'business-plan'
      }
    },
    {
      text: `# Email Communication Guidelines

## Email Templates and Best Practices

### Product Recommendation Emails
When recommending products to customers:
- Start with personalized greeting using customer name
- Reference customer's current relationship and account history
- Clearly explain product benefits relevant to customer's situation
- Include clear call-to-action
- Add compliance disclosures as required
- Professional, friendly tone

### CD Maturity Reminder Template
Subject: Your Certificate of Deposit is Maturing Soon

Dear [Customer Name],

Your Certificate of Deposit (Account #XXXX) is scheduled to mature on [Date]. You have the following options:
1. Renew at current rates
2. Withdraw funds
3. Change terms or amount

Current rates: [Rate]% APY for [Term]

Please contact us at [Phone] or visit [Branch] to discuss your options.

Best regards,
[Bank Name]

### Follow-up Email Template
Subject: Following Up on Our Recent Conversation

Dear [Customer Name],

Thank you for your interest in [Product/Service]. I wanted to follow up and see if you have any questions.

[Personalized content based on previous interaction]

I'm here to help. Please don't hesitate to reach out.

Best regards,
[Your Name]
[Title]
[Contact Information]`,
      metadata: {
        source: 'email-guidelines.md',
        type: 'communication',
        category: 'templates'
      }
    },
    {
      text: `# Product Recommendations Guide

## Customer Profiling for Product Recommendations

### High Balance Customers (>$100,000)
Recommended products:
- Premium Savings Account
- Jumbo CDs
- Investment Advisory Services
- Premium Credit Cards
- Private Banking Services

### Mid-Range Customers ($10,000-$100,000)
Recommended products:
- Standard Savings Accounts
- Regular CDs
- Personal Loans
- Credit Cards
- Online Banking Services

### Young Professionals
Recommended products:
- High-yield savings accounts
- Investment accounts
- Credit building products
- Mobile banking features
- Financial planning tools

### Retirees
Recommended products:
- CDs for stable income
- Retirement accounts
- Estate planning services
- Low-risk investment options
- Senior-friendly banking services`,
      metadata: {
        source: 'product-recommendations.md',
        type: 'sales',
        category: 'recommendations'
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

