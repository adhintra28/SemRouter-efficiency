export interface Model {
  id: string;
  name: string;
  parameters: string;
  inputCostPer1M: number; // in USD
  outputCostPer1M: number; // in USD
  avgLatency: number; // in ms
  description: string;
  color: string;
}

export const MODELS: Record<string, Model> = {
  nano: {
    id: "nano",
    name: "Gemini Nano",
    parameters: "1.8B",
    inputCostPer1M: 0.03,
    outputCostPer1M: 0.03,
    avgLatency: 110,
    description: "On-device tasks, short text processing, fast greetings",
    color: "#6366f1", // Indigo
  },
  flash: {
    id: "flash",
    name: "Gemini Flash",
    parameters: "8B",
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    avgLatency: 320,
    description: "Summarization, translation, simple data extraction",
    color: "#06b6d4", // Cyan
  },
  pro: {
    id: "pro",
    name: "Gemini Pro",
    parameters: "27B",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    avgLatency: 780,
    description: "Coding, multi-step logic, structured reasoning",
    color: "#a855f7", // Purple
  },
  ultra: {
    id: "ultra",
    name: "Gemini Ultra",
    parameters: "137B+",
    inputCostPer1M: 5.00,
    outputCostPer1M: 15.00,
    avgLatency: 1650,
    description: "Complex mathematical proofs, system architecture, hard coding problems",
    color: "#ec4899", // Pink
  },
};

export interface ScoreBreakdown {
  nano: number;
  flash: number;
  pro: number;
  ultra: number;
}

export interface RoutingDecision {
  query: string;
  model: Model;
  reason: string;
  scores: ScoreBreakdown;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  simulatedResponse: string;
  timestamp: string;
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
export function generateSimulatedResponse(query: string, category: string): { response: string, inTokens: number, outTokens: number } {
  const inTokens = Math.max(5, Math.ceil(query.length / 4));
  let outTokens = 20;
  let response = "";

  switch (category) {
    case "nano":
      response = `[Gemini Nano Response] Replicated simple answer. Processing quick request: "${query.substring(0, 30)}${query.length > 30 ? '...' : ''}" successfully.`;
      outTokens = Math.ceil(response.length / 4);
      break;
    case "flash":
      response = `[Gemini Flash Response] Here is a quick summarization and factual answer regarding your query. I have parsed the details and extracted the relevant information: we analyzed your prompt "${query}" and found it falls within medium complexity. Please let me know if you need specific bullet points.`;
      outTokens = Math.ceil(response.length / 4);
      break;
    case "pro":
      response = `[Gemini Pro Response] Let's analyze your request methodically. 
1. **Context Analysis**: The query asks for detail on "${query}".
2. **Implementation/Reasoning**: To address this, we need structured thinking:
   - Identify variables and design patterns.
   - Implement logical checks.
3. **Conclusion**: This requires mid-to-high parameter sizes to resolve correctly, maintaining high quality without the cost of our largest models.`;
      outTokens = Math.ceil(response.length / 4);
      break;
    case "ultra":
      response = `[Gemini Ultra Response] ### Comprehensive Deep Analysis
Your query involves complex logical constraints and high cognitive difficulty. 

#### System Design / Analytical Proof:
To formulate a complete solution for "${query}", we construct a mathematical model or distributed architecture. This ensures fault-tolerance, low resource overhead, and optimal algorithmic efficiency.

#### Refactored Approach & Optimizations:
We must account for edge cases (null inputs, racing conditions, overflow limits) and index configurations. 
By scaling vertically and horizontally, the system maintains integrity under heavy multi-tenant operations. 
*(This answer represents 137B+ parameter reasoning density, ensuring perfect precision for critical tasks).*`;
      outTokens = Math.ceil(response.length / 4);
      break;
  }

  return { response, inTokens, outTokens };
}

// Semantic routing rules evaluator
export function evaluateQueryComplexity(
  query: string, 
  thresholds: { nano: number; flash: number; pro: number }
): { scores: ScoreBreakdown; selectedModelId: string; reason: string } {
  const cleanText = query.toLowerCase();
  
  // Keyword definitions
  const nanoKeywords = ["hi", "hello", "hey", "hola", "greetings", "thanks", "thank you", "bye", "goodbye", "welcome", "yo", "morning", "night", "ok", "okay", "yes", "no"];
  const flashKeywords = ["what is", "who is", "when did", "capital", "weather", "translate", "summarize", "convert", "correct", "spelling", "define", "list of", "synonym", "how tall", "formula", "temperature", "extract"];
  const proKeywords = ["how do i", "explain how", "write a", "code to", "implement", "script", "algorithm", "debug", "function", "compare", "pros and cons", "analyze", "why does", "solve", "calculate", "python", "javascript", "program", "class", "difference between"];
  const ultraKeywords = ["architecture", "system design", "optimize", "mathematical proof", "proof", "derive", "complex", "refactor", "compiler", "machine learning", "neural network", "transformer", "fault-tolerant", "concurrent", "lock-free", "thread", "database design", "b-tree"];

  let nanoScore = 0;
  let flashScore = 0;
  let proScore = 0;
  let ultraScore = 0;

  // 1. Length Factor: extremely short queries lean Nano/Flash; very long ones lean Pro/Ultra
  if (query.length < 20) {
    nanoScore += 4;
    flashScore += 2;
  } else if (query.length < 80) {
    flashScore += 3;
    nanoScore += 1;
    proScore += 1;
  } else if (query.length < 300) {
    proScore += 3;
    flashScore += 2;
  } else {
    ultraScore += 4;
    proScore += 2;
  }

  // 2. Keyword matching
  const words = cleanText.split(/[^a-zA-Z0-9$_\-+]+/);
  
  words.forEach(word => {
    if (word.length < 2) return;
    if (nanoKeywords.includes(word)) nanoScore += 2;
    if (flashKeywords.some(kw => kw.includes(word) || word.includes(kw))) flashScore += 1.5;
    if (proKeywords.some(kw => kw.includes(word) || word.includes(kw))) proScore += 1.8;
    if (ultraKeywords.some(kw => kw.includes(word) || word.includes(kw))) ultraScore += 2.2;
  });

  // 3. Syntax patterns (Regex heuristics)
  // Code indicator
  const hasCodeSyntax = /[{}\[\]();=<>+\-*\/]/.test(query) && (cleanText.includes("def ") || cleanText.includes("function") || cleanText.includes("var ") || cleanText.includes("const") || cleanText.includes("class ") || cleanText.includes("import ") || cleanText.includes("cpp") || cleanText.includes("java") || cleanText.includes("rust"));
  if (hasCodeSyntax) {
    proScore += 5;
    ultraScore += 3;
  }

  // Math/Equation indicator
  const hasMathSyntax = /[\d]+[\s]*[\+\-\*\/=]+[\s]*[\d]+/.test(query) || cleanText.includes("proof") || cleanText.includes("solve") || cleanText.includes("integral") || cleanText.includes("equation") || cleanText.includes("square root");
  if (hasMathSyntax) {
    proScore += 3;
    ultraScore += 4;
  }

  // Large system indicators
  const hasSystemDesign = cleanText.includes("system design") || cleanText.includes("architecture") || cleanText.includes("scalable") || cleanText.includes("microservices") || cleanText.includes("load balancer") || cleanText.includes("fault-tolerant");
  if (hasSystemDesign) {
    ultraScore += 8;
  }

  // Normalize scores to a scale of 0-10
  const maxRawScore = Math.max(nanoScore, flashScore, proScore, ultraScore, 1);
  const scores: ScoreBreakdown = {
    nano: Math.round((nanoScore / maxRawScore) * 100) / 10,
    flash: Math.round((flashScore / maxRawScore) * 100) / 10,
    pro: Math.round((proScore / maxRawScore) * 100) / 10,
    ultra: Math.round((ultraScore / maxRawScore) * 100) / 10,
  };

  // Determine complexity based on normalized score distributions and user thresholds
  // We can measure complexity on a scale of 0 - 3 (Nano = 0, Flash = 1, Pro = 2, Ultra = 3)
  // Or we look at which category has the highest relative strength, modulated by thresholds.
  
  // Custom complexity metric from 0 to 10
  // Weights: nano contribution = 1, flash = 4, pro = 7, ultra = 10
  const weightedSum = (scores.nano * 1) + (scores.flash * 4) + (scores.pro * 7) + (scores.ultra * 10);
  const totalScoreSum = (scores.nano + scores.flash + scores.pro + scores.ultra) || 1;
  const complexityLevel = weightedSum / totalScoreSum; // ranges 1.0 to 10.0

  let selectedModelId = "flash";
  let reason = "";

  if (complexityLevel < thresholds.nano) {
    selectedModelId = "nano";
    reason = `Conversational intent and very low query complexity (Score: ${complexityLevel.toFixed(1)} < ${thresholds.nano}). Routed to ultra-light 1.8B parameter model.`;
  } else if (complexityLevel < thresholds.flash) {
    selectedModelId = "flash";
    reason = `Factual lookup or straightforward request. Low-to-medium complexity (Score: ${complexityLevel.toFixed(1)} < ${thresholds.flash}). Routed to 8B parameter model for balanced speed and cost.`;
  } else if (complexityLevel < thresholds.pro) {
    selectedModelId = "pro";
    reason = `Coding syntax, multi-step logic, or standard analytical demand (Score: ${complexityLevel.toFixed(1)} < ${thresholds.pro}). Routed to 27B parameter model to ensure reasoning accuracy.`;
  } else {
    selectedModelId = "ultra";
    reason = `Highly complex logic, system architecture constraints, or advanced math proof (Score: ${complexityLevel.toFixed(1)} >= ${thresholds.pro}). Routed to premium 137B+ parameter model for maximum reliability.`;
  }

  return { scores, selectedModelId, reason };
}

// Router simulation engine
export function routeQuery(
  queryText: string,
  thresholds = { nano: 2.8, flash: 5.2, pro: 7.8 }
): RoutingDecision {
  const { scores, selectedModelId, reason } = evaluateQueryComplexity(queryText, thresholds);
  const model = MODELS[selectedModelId];

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
    // Adapt output tokens slightly based on model selection to simulate density differences
    if (selectedModelId === "nano") {
      outTokens = Math.max(5, Math.ceil(preset.estimatedOutputTokens * 0.8));
    } else if (selectedModelId === "ultra") {
      outTokens = Math.ceil(preset.estimatedOutputTokens * 1.25);
    } else {
      outTokens = preset.estimatedOutputTokens;
    }
  } else {
    const custom = generateSimulatedResponse(queryText, selectedModelId);
    responseText = custom.response;
    inTokens = custom.inTokens;
    outTokens = custom.outTokens;
  }

  // Calculate cost: (inputTokens / 1,000,000 * inputCostPer1M) + (outputTokens / 1,000,000 * outputCostPer1M)
  const cost = (inTokens / 1000000 * model.inputCostPer1M) + (outTokens / 1000000 * model.outputCostPer1M);
  
  // Calculate simulated latency with slight random jitter (+-15%)
  const jitter = 0.85 + Math.random() * 0.3;
  const latency = Math.round(model.avgLatency * jitter);

  return {
    query: queryText,
    model,
    reason,
    scores,
    inputTokens: inTokens,
    outputTokens: outTokens,
    cost,
    latency,
    simulatedResponse: responseText,
    timestamp: new Date().toLocaleTimeString(),
  };
}
