export interface Model {
  id: string;
  name: string;
  provider: "google" | "openai" | "groq" | "anthropic";
  parameters: string;
  inputCostPer1M: number; // in USD
  outputCostPer1M: number; // in USD
  avgLatency: number; // in ms
  description: string;
  color: string;
  apiModelId: string;
}

export const MODELS: Record<string, Model> = {
  // Google
  "gemini-nano": {
    id: "gemini-nano",
    name: "Gemini Nano",
    provider: "google",
    parameters: "1.8B",
    inputCostPer1M: 0.03,
    outputCostPer1M: 0.03,
    avgLatency: 110,
    description: "On-device tasks, short text processing, fast greetings",
    color: "#94a3b8", // Slate 400
    apiModelId: "gemini-1.5-flash", // fall back to flash since nano isn't in public web API
  },
  "gemini-flash": {
    id: "gemini-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    parameters: "8B",
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    avgLatency: 280,
    description: "Summarization, translation, simple data extraction",
    color: "#64748b", // Slate 500
    apiModelId: "gemini-1.5-flash",
  },
  "gemini-pro": {
    id: "gemini-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    parameters: "27B equivalent",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    avgLatency: 720,
    description: "Coding, multi-step logic, structured reasoning",
    color: "#475569", // Slate 600
    apiModelId: "gemini-1.5-pro",
  },

  // OpenAI
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    parameters: "12B equivalent",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    avgLatency: 250,
    description: "Fast, cheap, and very smart lightweight model",
    color: "#64748b", // Slate 500
    apiModelId: "gpt-4o-mini",
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    parameters: "175B+ equivalent",
    inputCostPer1M: 5.00,
    outputCostPer1M: 15.00,
    avgLatency: 1200,
    description: "State-of-the-art reasoning, logic, and coding",
    color: "#334155", // Slate 700
    apiModelId: "gpt-4o",
  },

  // Groq / Meta
  "llama-3-8b": {
    id: "llama-3-8b",
    name: "Llama 3 8B (Groq)",
    provider: "groq",
    parameters: "8B",
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.08,
    avgLatency: 90,
    description: "Sub-100ms ultra-fast response for simple tasks",
    color: "#64748b", // Slate 500
    apiModelId: "llama3-8b-8192",
  },
  "llama-3-70b": {
    id: "llama-3-70b",
    name: "Llama 3 70B (Groq)",
    provider: "groq",
    parameters: "70B",
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    avgLatency: 180,
    description: "High-performance open weights reasoning",
    color: "#475569", // Slate 600
    apiModelId: "llama3-70b-8192",
  },

  // Anthropic
  "claude-3-haiku": {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    parameters: "9B equivalent",
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    avgLatency: 350,
    description: "Balanced speed and conversational quality",
    color: "#64748b", // Slate 500
    apiModelId: "claude-3-haiku-20240307",
  },
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    parameters: "150B+ equivalent",
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    avgLatency: 1400,
    description: "Deep reasoning, coding, and precise analysis",
    color: "#334155", // Slate 700
    apiModelId: "claude-3-5-sonnet-20240620",
  },
};

export interface ModelExecutionResult {
  modelId: string;
  modelName: string;
  provider: string;
  query: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  totalCost: number;
  latency: number;
  timestamp: string;
  isLive: boolean;
}

// Preset query database for simulations and demo testing
export interface PresetQuery {
  text: string;
  expectedCategory: "easy" | "medium" | "hard" | "extreme";
  simulatedResponse: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

export const PRESET_QUERIES: PresetQuery[] = [
  // Nano Queries (Greetings, trivial questions)
  {
    text: "hello! how's it going?",
    expectedCategory: "easy",
    simulatedResponse: "Hello! I'm doing well, thank you for asking. How can I help you today?",
    estimatedInputTokens: 7,
    estimatedOutputTokens: 18,
  },
  {
    text: "Thanks, that was very helpful!",
    expectedCategory: "easy",
    simulatedResponse: "You're very welcome! I'm glad I could help. Let me know if you need anything else.",
    estimatedInputTokens: 7,
    estimatedOutputTokens: 22,
  },
  {
    text: "What is 15 + 28?",
    expectedCategory: "easy",
    simulatedResponse: "15 + 28 = 43.",
    estimatedInputTokens: 8,
    estimatedOutputTokens: 8,
  },
  {
    text: "Hey, can you help me write a quick email subject line?",
    expectedCategory: "easy",
    simulatedResponse: "Of course! Let me know what your email is about, and I'll generate a few catchy options.",
    estimatedInputTokens: 14,
    estimatedOutputTokens: 21,
  },
  {
    text: "capitalize this: hello world",
    expectedCategory: "easy",
    simulatedResponse: "HELLO WORLD",
    estimatedInputTokens: 7,
    estimatedOutputTokens: 3,
  },
  {
    text: "Is Paris the capital of France?",
    expectedCategory: "easy",
    simulatedResponse: "Yes, Paris is the capital of France.",
    estimatedInputTokens: 9,
    estimatedOutputTokens: 9,
  },
  {
    text: "Translate 'Good morning' to Spanish",
    expectedCategory: "easy",
    simulatedResponse: "'Good morning' in Spanish is 'Buenos días'.",
    estimatedInputTokens: 8,
    estimatedOutputTokens: 11,
  },
  {
    text: "List five colors.",
    expectedCategory: "easy",
    simulatedResponse: "1. Red\n2. Blue\n3. Green\n4. Yellow\n5. Purple",
    estimatedInputTokens: 5,
    estimatedOutputTokens: 18,
  },

  // Flash Queries (Summarization, factual lookup, simple parsing)
  {
    text: "Summarize the water cycle in three sentences.",
    expectedCategory: "medium",
    simulatedResponse: "The water cycle describes how water evaporates from the Earth's surface, rises into the atmosphere, cools and condenses into clouds, and falls back to the surface as precipitation. This continuous cycle replenishes freshwater sources and is driven primarily by solar energy. Runoff then gathers in lakes, rivers, and oceans, where the evaporation process restarts.",
    estimatedInputTokens: 9,
    estimatedOutputTokens: 68,
  },
  {
    text: "Extract all email addresses from this text: 'Please reach out to support@example.com or billing-team@service.org for assistance.'",
    expectedCategory: "medium",
    simulatedResponse: "Here are the email addresses extracted from the text:\n1. support@example.com\n2. billing-team@service.org",
    estimatedInputTokens: 25,
    estimatedOutputTokens: 25,
  },
  {
    text: "What are the primary differences between active and passive transport in cells?",
    expectedCategory: "medium",
    simulatedResponse: "Active transport requires the expenditure of cellular energy (ATP) to move substances against their concentration gradient (from low to high concentration), whereas passive transport moves substances along their concentration gradient (from high to low concentration) without using cellular energy.",
    estimatedInputTokens: 14,
    estimatedOutputTokens: 51,
  },
  {
    text: "Convert 120 Fahrenheit to Celsius, show the formula.",
    expectedCategory: "medium",
    simulatedResponse: "Formula: C = (F - 32) * 5/9\nCalculation: C = (120 - 32) * 5/9 = 88 * 5/9 = 48.89°C.",
    estimatedInputTokens: 11,
    estimatedOutputTokens: 35,
  },
  {
    text: "Suggest 5 blog post titles about remote work productivity.",
    expectedCategory: "medium",
    simulatedResponse: "1. 10 Daily Habits of Highly Productive Remote Workers\n2. The Ultimate Guide to Setting Up Your Perfect Home Office\n3. Overcoming Distractions: How to Stay Focused at Home\n4. Digital Collaboration: Best Tools for Remote Teams\n5. Finding Balance: Preventing Burnout in the Remote Era",
    estimatedInputTokens: 10,
    estimatedOutputTokens: 62,
  },
  {
    text: "Correct the grammar in this sentence: 'They was going to the store but forgot their wallets.'",
    expectedCategory: "medium",
    simulatedResponse: "Corrected: 'They were going to the store but forgot their wallets.' (Changed 'was' to 'were' to match plural subject 'They').",
    estimatedInputTokens: 16,
    estimatedOutputTokens: 29,
  },
  {
    text: "Who wrote the play Hamlet and what year was it written?",
    expectedCategory: "medium",
    simulatedResponse: "Hamlet was written by William Shakespeare. It is believed to have been written between 1599 and 1601.",
    estimatedInputTokens: 12,
    estimatedOutputTokens: 24,
  },

  // Pro Queries (Coding, multi-step logic, analytical essays)
  {
    text: "Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation.",
    expectedCategory: "hard",
    simulatedResponse: "```javascript\nfunction isPalindrome(str) {\n  // Clean the string: remove non-alphanumeric chars and lowercase it\n  const cleanStr = str.replace(/[^A-Za-z0-9]/g, '').toLowerCase();\n  \n  // Check if reversed equals original\n  const reversed = cleanStr.split('').reverse().join('');\n  return cleanStr === reversed;\n}\n\n// Example usage:\nconsole.log(isPalindrome(\"A man, a plan, a canal. Panama\")); // true\n```",
    estimatedInputTokens: 18,
    estimatedOutputTokens: 110,
  },
  {
    text: "Compare and contrast SQL and NoSQL databases. When would you use one over the other?",
    expectedCategory: "hard",
    simulatedResponse: "SQL databases are relational, table-based, have a predefined schema, and scale vertically. They are ideal for applications requiring ACID compliance and complex queries (e.g., financial transaction systems). NoSQL databases are non-relational, document/key-value/graph-based, have dynamic schemas, and scale horizontally. They are ideal for unstructured data, rapidly evolving schemas, and massive write loads (e.g., real-time analytics, content management systems).",
    estimatedInputTokens: 18,
    estimatedOutputTokens: 85,
  },
  {
    text: "Explain the concept of 'Event Loop' in Node.js and how it handles asynchronous operations.",
    expectedCategory: "hard",
    simulatedResponse: "The Event Loop allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. It does this by offloading operations to the system kernel whenever possible. The loop runs in phases (timers, pending callbacks, idle/prepare, poll, check, close callbacks). When an async operation completes, its callback is placed in the task queue, and the event loop executes it when the call stack is empty.",
    estimatedInputTokens: 16,
    estimatedOutputTokens: 84,
  },
  {
    text: "Find the bug in this Python code:\n```python\ndef average(nums):\n    total = 0\n    for n in nums:\n        total += n\n    return total / len(nums)\n```\nWhat happens if the list is empty?",
    expectedCategory: "hard",
    simulatedResponse: "The bug is a potential `ZeroDivisionError` if the `nums` list is empty (`len(nums)` becomes 0). \n\n**Fix:**\n```python\ndef average(nums):\n    if not nums:\n        return 0  # or None\n    return sum(nums) / len(nums)\n```",
    estimatedInputTokens: 38,
    estimatedOutputTokens: 65,
  },
  {
    text: "A train leaves Chicago at 60mph heading to New York. 2 hours later, a faster train leaves Chicago on a parallel track at 90mph. How long will it take the second train to catch the first?",
    expectedCategory: "hard",
    simulatedResponse: "Let $t$ be the time the second train travels. \nWhen the second train starts, the first train has already traveled for 2 hours at 60 mph, meaning it is 120 miles ahead.\nDistance = Speed × Time.\nFirst train's total distance: $60(t + 2)$\nSecond train's distance: $90t$\nSet them equal: $60t + 120 = 90t$\n$30t = 120$\n$t = 4$ hours.\nIt will take the second train 4 hours to catch up.",
    estimatedInputTokens: 45,
    estimatedOutputTokens: 110,
  },
  {
    text: "Draft a professional response to a client explaining that their feature request is out of scope for the current sprint but can be prioritized in the next one.",
    expectedCategory: "hard",
    simulatedResponse: "Subject: Feature Request Update - [Project Name]\n\nHi [Client Name],\n\nThank you for sharing the details on the new feature request. It sounds like a valuable addition to the platform.\n\nAfter reviewing this with the team, we find that it falls outside the scope of our current active sprint. To ensure we deliver the core features scheduled for this release on time and with high quality, we will document this request and queue it for prioritization in our upcoming sprint starting next week. \n\nWe will review the timeline and requirements with you during our next sprint planning session. Let me know if you have any questions.\n\nBest regards,\n[Your Name]",
    estimatedInputTokens: 35,
    estimatedOutputTokens: 135,
  },

  // Ultra Queries (Deep mathematical proofs, complex system architectures, high-level analysis)
  {
    text: "Design a high-level, fault-tolerant system architecture for a real-time collaborative document editor like Google Docs. Show components and database choices.",
    expectedCategory: "extreme",
    simulatedResponse: "### Fault-Tolerant Google Docs Architecture\n\n1. **Client Tier**: Web/Mobile app using Operational Transformation (OT) or CRDTs for local merging, syncing changes over WebSockets.\n2. **Gateway/Load Balancers**: NGINX / Envoy routing WebSocket connections to active document collaboration servers, using consistent hashing by Document ID.\n3. **Collaboration Servers (Stateful)**: Node.js/Go processes keeping active document edits in memory, pushing diffs to clients and syncing to a Redis pub/sub queue.\n4. **Conflict Resolution**: OT Engine resolving simultaneous edits. Redis handles ordering.\n5. **Persistence Tier**:\n   - *Relational DB (PostgreSQL)*: For user accounts, folder hierarchies, access control lists.\n   - *Document DB (Cassandra/DynamoDB)*: For version histories and chunked document document states. Scalable horizontal writes.\n6. **Cache**: Redis cluster caching active document states.\n7. **Failure Handling**: If a collaboration server dies, consistent hashing automatically routes users to a new node, which pulls the latest snapshot from Redis/DynamoDB and reconstructs the session.",
    estimatedInputTokens: 30,
    estimatedOutputTokens: 240,
  },
  {
    text: "Prove that the square root of 2 is irrational.",
    expectedCategory: "extreme",
    simulatedResponse: "### Proof by Contradiction:\nAssume $\\sqrt{2}$ is rational. Then $\\sqrt{2} = a/b$ for integers $a, b$ where the fraction is in simplest form (gcd$(a,b) = 1$).\n1. Squaring both sides: $2 = a^2 / b^2 \\implies a^2 = 2b^2$.\n2. Since $a^2$ is a multiple of 2, $a^2$ is even. By mathematical property, if $a^2$ is even, $a$ must also be even.\n3. Let $a = 2k$ for some integer $k$. Substituting this back: $(2k)^2 = 2b^2 \\implies 4k^2 = 2b^2 \\implies b^2 = 2k^2$.\n4. This implies $b^2$ is even, and thus $b$ must be even.\n5. If both $a$ and $b$ are even, they both share a common factor of 2, which contradicts the initial assumption that gcd$(a,b) = 1$.\nTherefore, $\\sqrt{2}$ must be irrational.",
    estimatedInputTokens: 14,
    estimatedOutputTokens: 200,
  },
  {
    text: "Write a high-performance C++ program that implements lock-free concurrent queue using atomic pointers.",
    expectedCategory: "extreme",
    simulatedResponse: "```cpp\n#include <atomic>\n\ntemplate <typename T>\nclass LockFreeQueue {\nprivate:\n    struct Node {\n        T data;\n        std::atomic<Node*> next;\n        Node(T val) : data(val), next(nullptr) {}\n    };\n    std::atomic<Node*> head;\n    std::atomic<Node*> tail;\n\npublic:\n    LockFreeQueue() {\n        Node* dummy = new Node(T());\n        head.store(dummy);\n        tail.store(dummy);\n    }\n\n    void enqueue(T val) {\n        Node* newNode = new Node(val);\n        Node* last;\n        Node* nextNode;\n        while (true) {\n            last = tail.load();\n            nextNode = last->next.load();\n            if (last == tail.load()) {\n                if (nextNode == nullptr) {\n                    if (last->next.compare_exchange_weak(nextNode, newNode)) {\n                        tail.compare_exchange_strong(last, newNode);\n                        return;\n                    }\n                } else {\n                    tail.compare_exchange_strong(last, nextNode);\n                }\n            }\n        }\n    }\n    // Dequeue follows similar CAS loop checking for empty state and moving head.\n};\n```",
    estimatedInputTokens: 20,
    estimatedOutputTokens: 250,
  },
  {
    text: "Explain the math behind self-attention in Transformers. Detail the Query, Key, and Value projections, scale factor, and softmax.",
    expectedCategory: "extreme",
    simulatedResponse: "In self-attention, input vectors are projected into three vector spaces: Queries ($Q$), Keys ($K$), and Values ($V$) using weight matrices $W_Q, W_K, W_V$:\n$$Q = XW_Q, \\quad K = XW_K, \\quad V = XW_V$$\n\nThe attention weights are computed using the dot product of queries and keys. To prevent vanishing gradients in the softmax function for large dimensions $d_k$ (the dimension of the key vectors), the dot product is scaled by $1/\\sqrt{d_k}$:\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n\nSoftmax normalization guarantees that attention weights sum to 1 row-wise, yielding a weighted sum of Value vectors ($V$) as the final output representation.",
    estimatedInputTokens: 25,
    estimatedOutputTokens: 180,
  },
  {
    text: "Given a database table of 100M rows with schema (id, user_id, action, created_at), how would you optimize a query that fetches the latest 10 actions of a specific user? Detail index structures.",
    expectedCategory: "extreme",
    simulatedResponse: "To optimize the query:\n`SELECT * FROM actions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10;`\n\n1. **Index Strategy**: Create a composite B-Tree index on `(user_id, created_at DESC)`.\n2. **How it works**: The index is ordered first by `user_id`. Within each user ID, keys are sorted in descending order of `created_at`. \n3. **Query Plan**: The database can perform an *Index Scan* directly to the first node matching `user_id`, and then read the first 10 leaf nodes. This takes $O(\\log N)$ time to search and $O(1)$ to retrieve, avoiding a full table scan and avoiding an expensive sorting operation in memory (filesort).",
    estimatedInputTokens: 38,
    estimatedOutputTokens: 140,
  }
];

// Fallback response generator if user inputs a custom query that is not in the preset list
export function generateSimulatedResponse(query: string, modelId: string): { response: string, inTokens: number, outTokens: number } {
  const inTokens = Math.max(5, Math.ceil(query.length / 4));
  let outTokens = 20;
  let response = "";

  const model = MODELS[modelId] || MODELS["gemini-flash"];
  const cleanText = query.toLowerCase();

  // Custom translation and greeting handlers to ensure simulated outputs match context
  const isTranslation = cleanText.includes("say") || cleanText.includes("translate") || cleanText.includes("spanish") || cleanText.includes("french") || cleanText.includes("german") || cleanText.includes("italian") || cleanText.includes("chinese") || cleanText.includes("japanese");
  const isGreeting = cleanText.includes("hello") || cleanText.includes("hi ") || cleanText.startsWith("hi") || cleanText.includes("hey") || cleanText.includes("how's it going") || cleanText.includes("how are you");

  if (isTranslation) {
    if (cleanText.includes("hello")) {
      response = `[${model.name} Response] "Hello" in Spanish is "Hola".`;
    } else if (cleanText.includes("good morning")) {
      response = `[${model.name} Response] "Good morning" in Spanish is "Buenos días".`;
    } else {
      response = `[${model.name} Response] To express "${query.replace(/translate|say/gi, '').trim()}" in the target language, you would say: "[Translated phrase]".`;
    }
    outTokens = Math.max(5, Math.ceil(response.length / 4));
  } else if (isGreeting) {
    response = `[${model.name} Response] Hello! I'm doing well, thank you. How can I help you today?`;
    outTokens = Math.max(5, Math.ceil(response.length / 4));
  } else if (model.id === "gemini-nano" || model.id === "llama-3-8b" || model.id === "claude-3-haiku" || model.id === "gpt-4o-mini") {
    // Trivial/Low Complexity tier simulated responses
    response = `[${model.name} Response] Trivial query processed. Prompt: "${query.substring(0, 35)}${query.length > 35 ? '...' : ''}". Everything looks good! Let me know if you need anything else.`;
    outTokens = Math.ceil(response.length / 4);
  } else if (model.id === "gemini-flash" || model.id === "gpt-4o-mini" || model.id === "claude-3-haiku") {
    // Medium complexity tier
    response = `[${model.name} Response] I have analyzed your request regarding "${query}". Here is a concise summary of the key facts:
- Complexity: Medium
- Focus Area: Informational Retrieval
This request has been successfully parsed and fulfilled by ${model.name} to optimize response latency and pricing.`;
    outTokens = Math.ceil(response.length / 4);
  } else if (model.id === "gemini-pro" || model.id === "llama-3-70b") {
    // High complexity tier
    response = `[${model.name} Response] Methodical reasoning for: "${query}".
1. Assessment: This query contains intermediate logical steps and coding requirements.
2. Analysis: We configure structured parameters and verify standard library definitions.
3. Conclusion: Handled by ${model.name} to provide precise coding/reasoning outputs.`;
    outTokens = Math.ceil(response.length / 4);
  } else {
    // Extreme complexity tier
    response = `[${model.name} Response] Deep Reasoning & System Evaluation
Your prompt requires deep parameter analysis: "${query}".

Proposed Approach:
We isolate variables, define edge conditions, and design a scalable, fault-tolerant structure. By evaluating standard constraints, we guarantee correctness.

*(Answer computed using the full parameter capacity of ${model.name} to ensure complete logical fidelity for complex tasks).*`;
    outTokens = Math.ceil(response.length / 4);
  }

  return { response, inTokens, outTokens };
}

// Single-model simulation runner
export function runModelQuery(
  queryText: string,
  modelId: string,
  modelSpec?: Model
): ModelExecutionResult {
  const model = modelSpec || MODELS[modelId] || MODELS["gemini-flash"];

  // Try to find in preset list for authentic responses
  const preset = PRESET_QUERIES.find(
    q => q.text.toLowerCase().trim() === queryText.toLowerCase().trim()
  );

  let responseText = "";
  let inTokens = 0;
  let outTokens = 0;

  if (preset) {
    responseText = preset.simulatedResponse;
    inTokens = preset.estimatedInputTokens;
    // Adapt output tokens slightly based on model complexity tier to simulate density differences
    if (model.id === "gemini-nano" || model.id === "llama-3-8b") {
      outTokens = Math.max(5, Math.ceil(preset.estimatedOutputTokens * 0.8));
    } else if (model.id === "gpt-4o" || model.id === "claude-3-5-sonnet") {
      outTokens = Math.ceil(preset.estimatedOutputTokens * 1.25);
    } else {
      outTokens = preset.estimatedOutputTokens;
    }
  } else {
    const custom = generateSimulatedResponse(queryText, model.id);
    responseText = custom.response;
    inTokens = custom.inTokens;
    outTokens = custom.outTokens;
  }

  // Calculate cost
  const cost = (inTokens / 1000000 * model.inputCostPer1M) + (outTokens / 1000000 * model.outputCostPer1M);
  
  // Calculate simulated latency with slight random jitter (+-15%)
  const jitter = 0.85 + Math.random() * 0.3;
  const latency = Math.round(model.avgLatency * jitter);

  return {
    modelId: model.id,
    modelName: model.name,
    provider: model.provider,
    query: queryText,
    response: responseText,
    inputTokens: inTokens,
    outputTokens: outTokens,
    inputCostPer1M: model.inputCostPer1M,
    outputCostPer1M: model.outputCostPer1M,
    totalCost: cost,
    latency: latency,
    timestamp: new Date().toLocaleTimeString(),
    isLive: false,
  };
}

function getWords(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));
}

function calculateJaccardSimilarity(text1: string, text2: string): number {
  const set1 = getWords(text1);
  const set2 = getWords(text2);
  
  if (set1.size === 0 && set2.size === 0) return 1;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export function classifyQueryByPresetSimilarity(query: string): 'nano' | 'flash' | 'pro' | 'ultra' {
  let bestPreset = PRESET_QUERIES[0];
  let maxSimilarity = -1;
  
  for (const preset of PRESET_QUERIES) {
    const sim = calculateJaccardSimilarity(query, preset.text);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      bestPreset = preset;
    }
  }
  
  const categoryMapping: Record<string, 'nano' | 'flash' | 'pro' | 'ultra'> = {
    easy: 'nano',
    medium: 'flash',
    hard: 'pro',
    extreme: 'ultra'
  };
  
  return categoryMapping[bestPreset.expectedCategory] || 'flash';
}

export function classifyQueryComplexity(query: string): 'nano' | 'flash' | 'pro' | 'ultra' {
  return classifyQueryByPresetSimilarity(query);
}

export function getIntersectionModelId(
  results: ModelExecutionResult[],
  precomputedComplexity?: 'nano' | 'flash' | 'pro' | 'ultra' | null,
  latencyWeight = 0.5,
  costWeight = 0.5
): string | null {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0].modelId;

  const query = results[0].query;
  const complexity = precomputedComplexity || classifyQueryComplexity(query);

  const tierLevels = { nano: 1, flash: 2, pro: 3, ultra: 4 };
  const queryLevel = tierLevels[complexity];

  const modelTierLevels: Record<string, number> = {
    'gemini-nano': 1,
    'llama-3-8b': 1,
    'claude-3-haiku': 1,
    'gpt-4o-mini': 2,
    'gemini-flash': 2,
    'gemini-pro': 3,
    'llama-3-70b': 3,
    'gpt-4o': 4,
    'claude-3-5-sonnet': 4
  };

  // Find eligible models of the required level or gracefully degrade to next highest available level
  let eligibleResults: ModelExecutionResult[] = [];
  for (let level = queryLevel; level >= 1; level--) {
    eligibleResults = results.filter(r => (modelTierLevels[r.modelId] || 1) >= level);
    if (eligibleResults.length > 0) {
      break;
    }
  }

  if (eligibleResults.length === 0) {
    eligibleResults = results;
  }

  const sortedByCost = [...eligibleResults].sort((a, b) => a.totalCost - b.totalCost);
  const sortedByLatency = [...eligibleResults].sort((a, b) => a.latency - b.latency);

  const modelScores: Record<string, number> = {};

  eligibleResults.forEach((r) => {
    const costRank = sortedByCost.findIndex(item => item.modelId === r.modelId) + 1;
    const latencyRank = sortedByLatency.findIndex(item => item.modelId === r.modelId) + 1;
    modelScores[r.modelId] = (costRank * costWeight) + (latencyRank * latencyWeight);
  });

  let bestModelId = eligibleResults[0].modelId;
  let bestScore = Infinity;

  eligibleResults.forEach((r) => {
    if (modelScores[r.modelId] < bestScore) {
      bestScore = modelScores[r.modelId];
      bestModelId = r.modelId;
    } else if (modelScores[r.modelId] === bestScore) {
      const currentBest = eligibleResults.find(item => item.modelId === bestModelId);
      if (currentBest && r.latency < currentBest.latency) {
        bestModelId = r.modelId;
      }
    }
  });

  return bestModelId;
}

export interface SegmentedPart {
  text: string;
  complexity: 'nano' | 'flash' | 'pro' | 'ultra';
  routedModelId: string;
  routedModelName: string;
  cost: number;
  latency: number;
  tokens: number;
  response: string;
}

export function segmentQuery(query: string): string[] {
  const preset = getPresetSegmentation(query);
  if (preset) return preset;

  // Split query by sentence boundaries or major conjunctions
  const parts = query
    .split(/(?:\. |\? |\! |; |\band also\b|\band then\b|\bthen\b|, and |\r?\n)/i)
    .map(p => p.trim())
    .filter(p => p.length > 2);

  if (parts.length === 0) {
    return [query];
  }
  return parts;
}

export function getPresetSegmentation(query: string): string[] | null {
  const clean = query.toLowerCase().trim();
  
  if (clean.includes("palindrome") && clean.includes("capital of france")) {
    return [
      "Hello!",
      "Write a JavaScript function to check if a string is a palindrome, ignoring spaces and punctuation.",
      "Is Paris the capital of France?"
    ];
  }
  
  if (clean.includes("nosql") && clean.includes("google docs")) {
    return [
      "Hey, can you help me write a quick email subject line?",
      "Compare and contrast SQL and NoSQL databases. When would you use one over the other?",
      "Design a high-level, fault-tolerant system architecture for a real-time collaborative document editor like Google Docs. Show components and database choices."
    ];
  }

  if (clean.includes("event loop") && clean.includes("15 + 28") && clean.includes("productivity")) {
    return [
      "hello! how's it going?",
      "Explain the concept of 'Event Loop' in Node.js and how it handles asynchronous operations.",
      "What is 15 + 28?",
      "Suggest 5 blog post titles about remote work productivity."
    ];
  }

  return null;
}

