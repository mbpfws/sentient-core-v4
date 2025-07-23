---
aliases:
  - "## Detailed Development Plan: Phase 1 – Automated Project Definition & Documentation Generation (Multi-Agent RAG System)"
---


### **Epic 1: Environment & Infrastructure Setup**

**Description:** Establish the foundational technical environment, including code repositories, security mechanisms, observability, and core data schemas, to support the Multi-Agent RAG System's development and operation.

---

**Development Unit: 1.1 Provision Code Repository with CI/CD & Dependencies**

*   **Description:** Set up a version-controlled code repository, integrate Continuous Integration/Continuous Deployment (CI/CD) pipelines, and pre-install necessary Python dependencies (LangGraph, LangChain, Pydantic, etc.).
*   **Backend (API & Data):**
    *   **API Operations:**
        *   `POST /api/repo/create`: Trigger repository creation (if automated).
        *   `POST /api/ci-cd/configure`: Configure CI/CD hooks (e.g., GitHub Actions, GitLab CI API calls).
        *   `GET /api/package-manager/install`: Execute dependency installation commands (e.g., `pip install -r requirements.txt`).
    *   **Permissions & Authentication Layers:**
        *   **Repository Access:** Git SSH keys or HTTPS tokens for repository creation/cloning.
        *   **CI/CD Integration:** OAuth tokens or API keys for CI/CD service (e.g., GitHub App, GitLab Personal Access Token) with `repo:write`, `workflow:write` scopes.
        *   **Package Manager:** Public access to PyPI/conda, or private registry credentials if applicable.
    *   **Data Table Integrations:**
        *   **Repository:** Git repository (file system or cloud-hosted).
        *   **CI/CD Configuration:** `.github/workflows/` or `.gitlab-ci.yml` files within the repository.
    *   **Triggers & Event Logic:**
        *   **CI/CD Hooks:** `push` or `pull_request` events trigger pipeline execution.
        *   **Dependency Installation:** Post-clone/post-checkout script execution.
*   **Frontend (UI & Interface):**
    *   **UI Component:** N/A (primarily infrastructure setup, often manual or scripted).
    *   **Interface Flow:** Initial setup via CLI scripts or cloud console. CI/CD dashboard for monitoring.
*   **End-to-End Testing Criteria:**
    *   Verify repository is accessible and clonable.
    *   Verify CI/CD pipeline triggers on push and successfully runs a basic test (e.g., `pytest`).
    *   Verify all specified dependencies are installed and importable in a test environment.

---

**Development Unit: 1.2 Configure Secure Secrets Management**

*   **Description:** Implement a secure system for managing sensitive credentials (API keys for LLMs, database credentials, etc.), ensuring they are not hardcoded and are accessed securely.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   `POST /api/secrets/store`: Store a new secret.
        *   `GET /api/secrets/retrieve`: Retrieve a secret by key.
        *   `DELETE /api/secrets/delete`: Delete a secret.
        *   (Using a secrets manager like AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, or environment variables for simplicity).
    *   **Permissions & Authentication Layers:**
        *   **Access Control:** IAM roles/policies (cloud providers), service accounts, or token-based authentication for secrets manager.
        *   **Application Permissions:** Least privilege principle for agents/services accessing specific secrets.
    *   **Data Table Integrations:**
        *   **Secrets Store:** Encrypted key-value store within the chosen secrets management service.
    *   **Triggers & Event Logic:**
        *   **Application Startup:** Load necessary secrets into environment variables or memory.
        *   **Secret Rotation:** Automated or manual triggers for secret rotation.
*   **Frontend (UI & Interface):**
    *   **UI Component:** N/A (management typically via cloud console, CLI, or dedicated secrets manager UI).
    *   **Interface Flow:** Developers/Admins interact with the secrets manager directly.
*   **End-to-End Testing Criteria:**
    *   Verify that a test secret can be stored and retrieved programmatically.
    *   Verify that unauthorized access attempts to secrets are denied.
    *   Verify that the application can successfully retrieve and use a test API key from the secrets manager.

---

**Development Unit: 1.3 Integrate Observability Tooling (LangSmith)**

*   **Description:** Integrate LangSmith (or a comparable tool) to provide run-time tracing, state-snapshot inspection, and debugging capabilities for the LangGraph-managed agent workflows.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   `POST /api/langsmith/trace`: Send trace data to LangSmith.
        *   `POST /api/langsmith/state-snapshot`: Send LangGraph state snapshots.
        *   (LangSmith SDK integration, typically via environment variables and function wrappers).
    *   **Permissions & Authentication Layers:**
        *   **LangSmith API Key:** Authenticate the application with LangSmith.
        *   **Network Access:** Ensure outbound connectivity to LangSmith endpoints.
    *   **Data Table Integrations:**
        *   **LangSmith Backend:** Proprietary data store managed by LangSmith for traces, runs, and datasets.
    *   **Triggers & Event Logic:**
        *   **Agent Execution:** Automatic tracing of LLM calls, tool usage, and agent steps.
        *   **State Changes:** Capture of LangGraph state at critical junctures.
*   **Frontend (UI & Interface):**
    *   **UI Component:** N/A (primary interface is the LangSmith web dashboard).
    *   **Interface Flow:** Developers/Operators access LangSmith dashboard to view traces, debug runs, and analyze performance.
*   **End-to-End Testing Criteria:**
    *   Verify that a simple LangGraph run generates visible traces in LangSmith.
    *   Verify that agent inputs, outputs, and intermediate states are captured correctly.
    *   Verify that errors in agent execution are logged and visible in LangSmith.

---

**Development Unit: 1.4 Define Central TypedDict/Pydantic Schemas**

*   **Description:** Create robust, type-hinted data schemas (using Pydantic or TypedDict) for shared agent state, such as `ProjectState` (representing the evolving project definition) and `DocArtifacts` (for generated documentation components).
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal Data Structures:** These schemas define the internal "API" for how agents communicate and store data within the LangGraph state.
        *   `ProjectState.model_dump()`: Serialization of state for persistence or inter-agent transfer.
        *   `DocArtifacts.parse_obj()`: Deserialization of artifacts.
    *   **Permissions & Authentication Layers:** N/A (internal code definitions).
    *   **Data Table Integrations:**
        *   **LangGraph State Persistence:** If LangGraph state is persisted (e.g., to Redis, PostgreSQL), these schemas dictate the structure of the stored JSON/binary data.
        *   **Artifact Storage:** `DocArtifacts` might be serialized and stored in a document database or file system.
    *   **Triggers & Event Logic:**
        *   **State Updates:** Any agent modifying the shared state will interact with these schemas.
        *   **Validation:** Pydantic's built-in validation triggers on data assignment.
*   **Frontend (UI & Interface):** N/A (developer-facing code definitions).
*   **End-to-End Testing Criteria:**
    *   Verify that `ProjectState` and `DocArtifacts` schemas correctly validate expected data types and structures.
    *   Verify serialization and deserialization of complex state objects work without data loss.
    *   Verify that agents can successfully read from and write to the shared state using these schemas.

---

### **Epic 2: Core Orchestrator Implementation**

**Description:** Develop the central intelligence of the Multi-Agent RAG System, responsible for parsing user input, dynamically spawning agent graphs, and managing human-in-the-loop interactions.

---

**Development Unit: 2.1 Implement Orchestrator Agent Node**

*   **Description:** Create the primary LangGraph node responsible for initial user prompt parsing, completeness scoring using embeddings, and dynamic routing to appropriate main or sub-graphs based on the prompt's content and completeness.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `user_prompt` as input, returns updated `ProjectState` and `next_node` command.
        *   **LLM API Call:** `POST /v1/models/gemini-pro:generateContent` (or similar) for prompt parsing/understanding.
        *   **Embedding Service API Call:** `POST /v1/embeddings:embedText` (or similar) to generate embeddings for similarity scoring.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** Authenticate with the LLM provider.
        *   **Embedding Service API Key:** Authenticate with the embedding service.
    *   **Data Table Integrations:**
        *   **Vector Store:** For storing and querying embeddings of known project patterns/examples to score prompt completeness.
        *   **LangGraph State:** Updates `ProjectState` with parsed prompt details and initial graph routing decision.
    *   **Triggers & Event Logic:**
        *   **User Input:** Triggered by the initial user prompt.
        *   **Completeness Threshold:** If embedding similarity score < 70%, trigger a "Clarification Prompt" sub-graph (see 3.2).
        *   **Dynamic Graph Spawning:** Conditional edges based on `ProjectState` to route to the next appropriate main graph (e.g., Input Ingestion, Scoping).
*   **Frontend (UI & Interface):**
    *   **UI Component:** `InitialPromptInput` (text area for user to enter project description).
    *   **Interface Flow:**
        1.  User enters project description.
        2.  Clicks "Start Project Definition".
        3.  Orchestrator processes; UI shows "Processing..." or routes to clarification/next step.
*   **End-to-End Testing Criteria:**
    *   Verify that valid, complete prompts are parsed and routed correctly to the next main graph.
    *   Verify that incomplete prompts trigger the clarification sub-graph.
    *   Verify embedding similarity scoring accurately reflects prompt completeness.
    *   Verify LLM integration for prompt understanding.

---

**Development Unit: 2.2 Embed Dynamic Task Scheduling Logic**

*   **Description:** Implement the mechanism within LangGraph agents to use `Command` returns, allowing agents to update the shared state and explicitly route to the next node in a single, atomic step, enabling flexible workflow orchestration.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **LangGraph `StateGraph` API:** Utilizes `StateGraph.add_node`, `StateGraph.add_edge`, `StateGraph.add_conditional_edges` with custom `Command` objects.
        *   **Internal Agent Logic:** Agents return a dictionary containing state updates and a `__next__` key for routing.
    *   **Permissions & Authentication Layers:** N/A (internal LangGraph mechanism).
    *   **Data Table Integrations:**
        *   **LangGraph State:** The `Command` mechanism directly manipulates the shared `ProjectState` and controls the graph's flow.
    *   **Triggers & Event Logic:**
        *   **Agent Completion:** An agent's successful execution triggers the `Command` return.
        *   **Conditional Routing:** Logic within the `Command` determines the next node based on updated state.
*   **Frontend (UI & Interface):** N/A (internal orchestration logic).
*   **End-to-End Testing Criteria:**
    *   Verify that a test agent can update a specific field in `ProjectState` and correctly route to a predefined next node.
    *   Verify that conditional routing based on state changes works as expected (e.g., if `validation_passed` is true, go to `ScopingGraph`).
    *   Verify that `Command` returns are atomic and prevent race conditions in state updates.

---

**Development Unit: 2.3 Wire HITL Pause/Resume Capability**

*   **Description:** Implement a mechanism to pause the LangGraph execution at designated checkpoints, emit a custom `Interrupt` state, and await explicit human approval before resuming the workflow.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **LangGraph `Interrupt` API:** Utilize LangGraph's built-in interrupt functionality.
        *   **Notification API:** `POST /api/notifications/send` (e.g., email, Slack, internal dashboard notification) to alert human reviewers.
        *   `POST /api/hitl/approve` / `POST /api/hitl/reject`: Endpoints for human reviewers to submit their decision.
    *   **Permissions & Authentication Layers:**
        *   **HITL User Authentication:** Secure login for human reviewers (e.g., OAuth, JWT).
        *   **Authorization:** Role-based access control to HITL review endpoints.
    *   **Data Table Integrations:**
        *   **LangGraph State:** The graph state is persisted when interrupted, including the `Interrupt` reason and current `ProjectState`.
        *   **Review Queue Table:** A database table (`hitl_reviews`) to store pending reviews, reviewer comments, and approval status.
            *   **Fields:** `id (PK)`, `graph_run_id (FK)`, `status (pending, approved, rejected)`, `review_notes`, `reviewer_id (FK)`, `created_at`, `updated_at`.
    *   **Triggers & Event Logic:**
        *   **Checkpoint Node:** A specific node in the graph emits an `Interrupt` state.
        *   **Human Action:** User clicks "Approve" or "Reject" in the UI, triggering the resume/re-route.
        *   **Timeout:** Optional timeout for review, triggering escalation or default action.
*   **Frontend (UI & Interface):**
    *   **UI Component:** `HITLReviewDashboard`
        *   **Display:** Shows current `ProjectState` (e.g., `InputSpec`, generated user stories), context for review.
        *   **Actions:** "Approve" button, "Reject" button, text area for comments.
    *   **Interface Flow:**
        1.  Graph reaches a HITL checkpoint.
        2.  Notification sent to reviewer.
        3.  Reviewer logs into `HITLReviewDashboard`.
        4.  Reviews the state, adds comments, clicks "Approve" or "Reject".
        5.  System resumes/re-routes based on decision.
*   **End-to-End Testing Criteria:**
    *   Verify that the graph pauses correctly at a designated checkpoint.
    *   Verify that a notification is sent to the designated reviewer.
    *   Verify that the `HITLReviewDashboard` accurately displays the relevant `ProjectState` for review.
    *   Verify that clicking "Approve" resumes the graph from the correct state.
    *   Verify that clicking "Reject" re-routes the graph to a refinement sub-graph or triggers an error state.
    *   Verify authentication and authorization for HITL reviewers.

---

### **Epic 3: Input Ingestion Graph**

**Description:** Develop the sub-graph responsible for receiving varied user inputs, normalizing them into a structured format, validating their completeness, and initiating clarification prompts if necessary.

---

**Development Unit: 3.1 Build Parser Agent Node**

*   **Description:** Create a LangGraph agent node capable of ingesting project descriptions in various formats (plain text, JSON, file uploads) and normalizing them into the standardized `InputSpec` Pydantic schema.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives raw input, returns `InputSpec` object.
        *   **File Upload API:** `POST /api/upload/project-spec` (if direct file uploads are supported by the system's frontend).
        *   **LLM API Call:** (Optional) For parsing complex plain text inputs into structured data.
    *   **Permissions & Authentication Layers:**
        *   **File Upload Permissions:** User authentication for uploading files.
        *   **LLM API Key:** If LLM is used for parsing.
    *   **Data Table Integrations:**
        *   **Temporary Storage:** For uploaded files (e.g., S3 bucket, local temp directory).
        *   **LangGraph State:** Updates `ProjectState` with the normalized `InputSpec`.
    *   **Triggers & Event Logic:**
        *   **Orchestrator Routing:** Triggered by the Orchestrator Agent after initial prompt.
        *   **Input Type Detection:** Logic to identify input format (e.g., file extension, JSON parsing attempt).
*   **Frontend (UI & Interface):**
    *   **UI Component:** `ProjectInputForm`
        *   **Inputs:** Text area for plain text, File upload component for JSON/other formats.
        *   **Action:** "Process Input" button.
    *   **Interface Flow:**
        1.  User provides input via text or file upload.
        2.  Clicks "Process Input".
        3.  Parser Agent processes; UI shows "Normalizing Input...".
*   **End-to-End Testing Criteria:**
    *   Verify that plain text input is correctly parsed into `InputSpec`.
    *   Verify that valid JSON input is correctly parsed.
    *   Verify that file uploads are handled and parsed correctly.
    *   Verify that invalid input formats are gracefully handled (e.g., error message).

---

**Development Unit: 3.2 Add Validator Agent Node & Clarification Sub-Graph**

*   **Description:** Implement a LangGraph agent node that validates the `InputSpec` for missing or ambiguous fields. If issues are found, it launches a "Clarification Prompt" sub-graph to interactively query the user up to three times for missing information.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `InputSpec`, returns `validation_passed` status and `clarification_questions` (if needed).
        *   **LLM API Call:** For generating context-aware clarification questions.
        *   **User Response API:** `POST /api/clarification/submit`: Endpoint for user to submit answers to clarification questions.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For question generation.
        *   **User Authentication:** For submitting clarification responses.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with `validation_passed` status, stores `clarification_questions` and `user_responses`.
        *   **Clarification Attempts Counter:** Stored in `ProjectState` to track attempts.
    *   **Triggers & Event Logic:**
        *   **Parser Agent Completion:** Triggered after `InputSpec` is normalized.
        *   **Validation Failure:** If `InputSpec` is incomplete/ambiguous, trigger "Clarification Prompt" sub-graph.
        *   **User Response:** Submission of clarification answers re-triggers validation.
        *   **Attempt Limit:** After 3 attempts, trigger a "Human Review" or "Assumption Generation" sub-graph.
*   **Frontend (UI & Interface):**
    *   **UI Component:** `ClarificationPromptModal`
        *   **Display:** Shows specific questions derived from validation.
        *   **Inputs:** Text fields for user answers.
        *   **Action:** "Submit Clarification" button.
    *   **Interface Flow:**
        1.  Validation fails.
        2.  `ClarificationPromptModal` appears.
        3.  User answers questions, clicks "Submit".
        4.  Validator re-runs; modal closes on success or re-prompts.
*   **End-to-End Testing Criteria:**
    *   Verify that an `InputSpec` with missing fields triggers clarification.
    *   Verify that the LLM generates relevant and clear clarification questions.
    *   Verify that user responses are correctly incorporated into `InputSpec`.
    *   Verify that the system re-prompts up to three times.
    *   Verify that after successful clarification, `validation_passed` is true and the graph proceeds.
    *   Verify behavior when the attempt limit is reached (e.g., escalates to HITL).

---

**Development Unit: 3.3 Checkpoint: HITL Review of Normalised InputSpec**

*   **Description:** Implement a mandatory Human-in-the-Loop (HITL) checkpoint where a human reviewer approves the final normalized `InputSpec` before the system proceeds to the scoping phase.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Interrupt:** Emits an `Interrupt` state when `InputSpec` is ready for review.
        *   **HITL Approval API:** `POST /api/hitl/input-spec-review`: Endpoint for reviewer decision (as defined in 2.3).
    *   **Permissions & Authentication Layers:**
        *   **HITL User Authentication & Authorization:** (As defined in 2.3).
    *   **Data Table Integrations:**
        *   **LangGraph State:** Persists the `InputSpec` and current graph state during the interrupt.
        *   **Review Queue Table:** Records the review request and decision (as defined in 2.3).
    *   **Triggers & Event Logic:**
        *   **Validator Agent Completion:** Triggered when `validation_passed == True`.
        *   **Human Approval/Rejection:** Resumes/re-routes the graph.
*   **Frontend (UI & Interface):**
    *   **UI Component:** `InputSpecReviewDashboard` (similar to `HITLReviewDashboard` in 2.3, but specific to `InputSpec`).
        *   **Display:** Presents the full normalized `InputSpec` in a readable format.
        *   **Actions:** "Approve InputSpec", "Reject InputSpec (with comments)".
    *   **Interface Flow:**
        1.  System pauses at checkpoint.
        2.  Reviewer accesses `InputSpecReviewDashboard`.
        3.  Reviews `InputSpec`, provides feedback if rejecting.
        4.  Clicks "Approve" or "Reject".
        5.  Graph proceeds or loops back for refinement.
*   **End-to-End Testing Criteria:**
    *   Verify that the graph pauses at this specific checkpoint.
    *   Verify that the `InputSpec` is accurately displayed in the review UI.
    *   Verify that "Approve" allows the graph to proceed to the Scoping Graph.
    *   Verify that "Reject" (with comments) routes the graph back to the Validator Agent or a refinement sub-graph.
    *   Verify that only authorized users can approve/reject.

---

### **Epic 4: Scoping Graph**

**Description:** Develop the sub-graph responsible for transforming the normalized `InputSpec` into detailed user stories and functional/non-functional requirements, including conflict detection.

---

**Development Unit: 4.1 User-Story Generator Agent**

*   **Description:** Create an agent that generates a comprehensive set of user stories from the `InputSpec`, leveraging prompt templates and RAG over a knowledge base of domain-specific patterns and best practices.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `InputSpec`, returns generated user stories.
        *   **LLM API Call:** For generating user stories based on prompt templates.
        *   **Vector Database Query:** `POST /api/vector-db/query`: To retrieve relevant domain patterns for RAG.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For generation.
        *   **Vector DB Access:** Credentials for the vector database.
    *   **Data Table Integrations:**
        *   **Vector Database:** Stores embeddings of domain patterns, user story examples, etc.
        *   **LangGraph State:** Updates `ProjectState` with the generated `user_stories` list.
    *   **Triggers & Event Logic:**
        *   **Input Ingestion Graph Completion:** Triggered after `InputSpec` is approved.
*   **Frontend (UI & Interface):** N/A (internal generation, output viewed later).
*   **End-to-End Testing Criteria:**
    *   Verify that the agent generates a reasonable number and quality of user stories from a given `InputSpec`.
    *   Verify that RAG effectively grounds the user stories in relevant domain patterns.
    *   Verify that prompt templates are correctly applied.

---

**Development Unit: 4.2 Requirements Agent**

*   **Description:** Develop an agent that derives functional and non-functional requirements from the `InputSpec` and generated user stories. It should also dynamically spawn additional sub-graphs if keywords like "scalability" or "AI integration" are detected, indicating complex requirements.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `InputSpec` and `user_stories`, returns `functional_requirements` and `non_functional_requirements`.
        *   **LLM API Call:** For requirement derivation.
        *   **Sub-Graph Spawning Logic:** LangGraph's conditional edges to route to specialized sub-graphs (e.g., `ScalabilityRequirementsGraph`, `AIIntegrationRequirementsGraph`).
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For generation.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with generated requirements.
    *   **Triggers & Event Logic:**
        *   **User-Story Generator Completion:** Triggered after user stories are generated.
        *   **Keyword Detection:** Triggers conditional routing to specialized sub-graphs.
*   **Frontend (UI & Interface):** N/A (internal generation).
*   **End-to-End Testing Criteria:**
    *   Verify that the agent accurately extracts functional and non-functional requirements.
    *   Verify that specific keywords (e.g., "scalability") correctly trigger the spawning of relevant sub-graphs.
    *   Verify that requirements are well-formed and unambiguous.

---

**Development Unit: 4.3 Conflict-Detection Node**

*   **Description:** Implement a LangGraph node that performs semantic diffing on the generated user stories and requirements to identify potential conflicts or inconsistencies. If conflicts are detected, it escalates to a "Conflict Resolution" sub-graph involving HITL.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `user_stories` and `requirements`, returns `conflicts_detected` status and `conflict_details`.
        *   **LLM API Call:** (Optional) For semantic analysis of potential conflicts.
        *   **Internal Diffing Logic:** Custom code for comparing and identifying inconsistencies.
        *   **HITL Escalation:** Triggers an `Interrupt` state and routes to a "Conflict Resolution" sub-graph (similar to 2.3).
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** If LLM is used for conflict analysis.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with conflict status and details.
        *   **Review Queue Table:** For HITL conflict resolution (as defined in 2.3).
    *   **Triggers & Event Logic:**
        *   **Requirements Agent Completion:** Triggered after requirements are generated.
        *   **Conflict Detection:** If conflicts are found, trigger HITL sub-graph.
*   **Frontend (UI & Interface):**
    *   **UI Component:** `ConflictResolutionDashboard` (similar to HITL dashboards).
        *   **Display:** Highlights conflicting requirements/user stories, provides context.
        *   **Actions:** "Resolve Conflict" (with input for resolution), "Escalate".
    *   **Interface Flow:**
        1.  Conflicts detected.
        2.  System pauses, reviewer notified.
        3.  Reviewer accesses dashboard, resolves conflict.
        4.  Graph resumes with updated requirements.
*   **End-to-End Testing Criteria:**
    *   Verify that the node correctly identifies predefined conflicting requirements.
    *   Verify that detected conflicts trigger the "Conflict Resolution" sub-graph and HITL notification.
    *   Verify that human resolution correctly updates the `ProjectState` and allows the graph to proceed.
    *   Verify that no conflicts are detected when requirements are consistent.

---

### **Epic 5: Design Graph**

**Description:** Develop the sub-graph responsible for generating high-level architectural designs, database schemas, and API definitions for the project being documented, incorporating AI-specific workflows if required.

---

**Development Unit: 5.1 Architecture Agent**

*   **Description:** Create an agent that drafts high-level component diagrams and proposes a suitable technology stack for the project, grounding its decisions using a Gemini Google Search tool for factual validation.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `requirements`, returns `architecture_diagram_description` and `tech_stack_proposal`.
        *   **LLM API Call:** For generating architectural concepts.
        *   **Google Search Tool API:** `GET /api/google-search`: To query for tech stack best practices, component examples.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For generation.
        *   **Google Search API Key:** For tool usage.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with architectural decisions.
    *   **Triggers & Event Logic:**
        *   **Scoping Graph Completion:** Triggered after requirements are finalized.
*   **Frontend (UI & Interface):** N/A (internal generation).
*   **End-to-End Testing Criteria:**
    *   Verify that the agent generates a coherent architectural description and tech stack.
    *   Verify that the Google Search tool is effectively used to ground factual claims.
    *   Verify that the proposed tech stack aligns with the project requirements.

---

**Development Unit: 5.2 Schema Agent**

*   **Description:** Develop an agent that generates an Entity-Relationship Diagram (ERD) and a detailed database schema based on the project's requirements. It should auto-chunk its output if the token budget is exceeded to ensure full schema generation.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `requirements`, returns `erd_description` and `database_schema_definition`.
        *   **LLM API Call:** For schema generation.
        *   **Internal Chunking Logic:** For splitting large schema outputs.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For generation.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with generated schema.
    *   **Triggers & Event Logic:**
        *   **Architecture Agent Completion:** Triggered after architecture is defined.
        *   **Token Budget Exceeded:** Triggers chunking logic.
*   **Frontend (UI & Interface):** N/A (internal generation).
*   **End-to-End Testing Criteria:**
    *   Verify that the agent generates a valid and comprehensive database schema.
    *   Verify that the schema correctly reflects the project's data entities and relationships.
    *   Verify that the auto-chunking mechanism works correctly for large schemas.

---

**Development Unit: 5.3 API Agent**

*   **Description:** Create an agent that defines REST/GraphQL endpoints for the project, ensuring this process only begins after the database schema has been validated (`schema_ok == True` in `ProjectState`).
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `requirements` and `database_schema`, returns `api_endpoint_definitions`.
        *   **LLM API Call:** For API definition generation.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For generation.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with generated API definitions.
    *   **Triggers & Event Logic:**
        *   **Schema Validation:** Triggered only when `ProjectState.schema_ok` is true.
*   **Frontend (UI & Interface):** N/A (internal generation).
*   **End-to-End Testing Criteria:**
    *   Verify that API endpoints are only generated after schema validation.
    *   Verify that the generated API definitions are consistent with the database schema and project requirements.
    *   Verify that common CRUD operations are defined for relevant entities.

---

**Development Unit: 5.4 Agentic-Workflow Sub-Graph (AI Integration)**

*   **Description:** If the `InputSpec.ai` flag is true, insert a specialized sub-graph to detail AI-specific components like RAG pipelines, memory stores, and agentic workflows for the project being documented.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `InputSpec` and `requirements`, returns `ai_workflow_details`.
        *   **LLM API Call:** For generating AI workflow descriptions.
        *   **Vector Database Tool:** For RAG pipeline design.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For generation.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with AI workflow details.
    *   **Triggers & Event Logic:**
        *   **Conditional Edge:** Triggered if `ProjectState.InputSpec.ai == True`.
*   **Frontend (UI & Interface):** N/A (internal generation).
*   **End-to-End Testing Criteria:**
    *   Verify that this sub-graph is only activated when `InputSpec.ai` is true.
    *   Verify that it generates relevant details for RAG pipelines, memory, and agent interactions.

---

**Development Unit: 5.5 Checkpoint: HITL Approval of Design Packet**

*   **Description:** Implement a mandatory Human-in-the-Loop (HITL) checkpoint for reviewing and approving the complete design packet (architecture, schema, API definitions, AI workflows). The orchestrator loops back for refinement on rejection.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Interrupt:** Emits an `Interrupt` state when design is ready for review.
        *   **HITL Approval API:** `POST /api/hitl/design-review`: Endpoint for reviewer decision (as defined in 2.3).
    *   **Permissions & Authentication Layers:**
        *   **HITL User Authentication & Authorization:** (As defined in 2.3).
    *   **Data Table Integrations:**
        *   **LangGraph State:** Persists the full `ProjectState` during the interrupt.
        *   **Review Queue Table:** Records the review request and decision (as defined in 2.3).
    *   **Triggers & Event Logic:**
        *   **Design Graph Completion:** Triggered after all design agents complete.
        *   **Human Approval/Rejection:** Resumes/re-routes the graph.
*   **Frontend (UI & Interface):**
    *   **UI Component:** `DesignReviewDashboard`
        *   **Display:** Presents architecture diagrams, ERDs, API specs, AI workflow details.
        *   **Actions:** "Approve Design", "Reject Design (with comments)".
    *   **Interface Flow:**
        1.  System pauses at checkpoint.
        2.  Reviewer accesses `DesignReviewDashboard`.
        3.  Reviews design, provides feedback if rejecting.
        4.  Clicks "Approve" or "Reject".
        5.  Graph proceeds or loops back to relevant design agents for refinement.
*   **End-to-End Testing Criteria:**
    *   Verify that the graph pauses at this checkpoint.
    *   Verify that all generated design artifacts are accurately displayed.
    *   Verify that "Approve" allows the graph to proceed to the Documentation Assembly Graph.
    *   Verify that "Reject" routes the graph back to the appropriate design agent(s) for iteration.

---

### **Epic 6: Documentation Assembly Graph**

**Description:** Develop the sub-graph responsible for compiling all generated artifacts into a consistent documentation structure, managing a prompt registry, and attaching metadata tags.

---

**Development Unit: 6.1 Doc-Assembler Agent**

*   **Description:** Create an agent that merges all generated artifacts (user stories, requirements, architecture, schemas, APIs) into a consistent folder structure, primarily using Markdown files with embedded JSON snippets.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `ProjectState`, outputs `documentation_files`.
        *   **File System Operations:** `WRITE /docs/` to create and populate documentation files.
    *   **Permissions & Authentication Layers:**
        *   **File System Permissions:** Write access to the designated documentation output directory.
    *   **Data Table Integrations:**
        *   **Output File System:** Stores the generated Markdown and JSON files.
        *   **LangGraph State:** Updates `ProjectState` with paths to generated documentation.
    *   **Triggers & Event Logic:**
        *   **Design Graph Approval:** Triggered after the design packet is approved.
*   **Frontend (UI & Interface):** N/A (internal generation).
*   **End-to-End Testing Criteria:**
    *   Verify that all expected documentation artifacts are present in the output directory.
    *   Verify that the folder structure is consistent and logical.
    *   Verify that Markdown and JSON snippets are correctly formatted.

---

**Development Unit: 6.2 Prompt-Registry Agent**

*   **Description:** Develop an agent that stores all system and user prompts used during the project definition process, along with version tags, to support future reuse and traceability.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `ProjectState` (containing prompt history), stores prompts.
        *   **Database CRUD:** `POST /api/prompts/store`: To save prompts.
    *   **Permissions & Authentication Layers:**
        *   **Database Access:** Credentials for the prompt registry database.
    *   **Data Table Integrations:**
        *   **Prompt Registry Table:** `prompts` table
            *   **Fields:** `id (PK)`, `prompt_text`, `prompt_type (system/user)`, `version`, `timestamp`, `graph_run_id (FK)`.
    *   **Triggers & Event Logic:**
        *   **Agent Execution:** Each time an agent uses a prompt, it's captured and sent to this agent.
*   **Frontend (UI & Interface):** N/A (internal storage).
*   **End-to-End Testing Criteria:**
    *   Verify that all system and user prompts are captured and stored in the registry.
    *   Verify that prompts are correctly versioned.
    *   Verify that prompts can be retrieved from the registry.

---

**Development Unit: 6.3 Metadata Tagger**

*   **Description:** Implement an agent that attaches embeddings-friendly metadata tags to the generated documentation artifacts, enabling efficient downstream retrieval and search.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `documentation_files`, outputs `tagged_metadata`.
        *   **Embedding Service API Call:** To generate embeddings for tags.
        *   **Vector Database Write:** `POST /api/vector-db/add`: To store document embeddings and metadata.
    *   **Permissions & Authentication Layers:**
        *   **Embedding Service API Key:** For generation.
        *   **Vector DB Access:** Credentials for the vector database.
    *   **Data Table Integrations:**
        *   **Vector Database:** Stores document embeddings and associated metadata (e.g., `doc_id`, `tags`, `summary`).
    *   **Triggers & Event Logic:**
        *   **Doc-Assembler Completion:** Triggered after documentation files are generated.
*   **Frontend (UI & Interface):** N/A (internal process).
*   **End-to-End Testing Criteria:**
    *   Verify that relevant metadata tags are generated for each document.
    *   Verify that embeddings are correctly generated for the tags/documents.
    *   Verify that metadata and embeddings are successfully stored in the vector database.

---

### **Epic 7: Validation & Robustness Graph**

**Description:** Develop the sub-graph responsible for automated quality assurance of the generated documentation, including rubric scoring, unit testing of specs, stress testing edge cases, and performance metric recording.

---

**Development Unit: 7.1 Automated Rubric Scoring**

*   **Description:** Implement a node that automatically scores the completeness and quality of the generated documentation against a predefined rubric, requiring a minimum 80% completeness to pass.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `documentation_files`, returns `completeness_score`.
        *   **LLM API Call:** For evaluating documentation against rubric criteria.
    *   **Permissions & Authentication Layers:**
        *   **LLM API Key:** For evaluation.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with the `completeness_score`.
    *   **Triggers & Event Logic:**
        *   **Documentation Assembly Completion:** Triggered after documentation is assembled.
        *   **Score Threshold:** If score < 80%, trigger a "Self-Repair" sub-graph or HITL.
*   **Frontend (UI & Interface):** N/A (internal process).
*   **End-to-End Testing Criteria:**
    *   Verify that the scoring mechanism accurately reflects documentation completeness.
    *   Verify that a score below 80% correctly triggers a re-generation or escalation.
    *   Verify that a score above 80% allows progression.

---

**Development Unit: 7.2 Unit Tests on Schema & API Specs + Self-Repair Sub-Graph**

*   **Description:** Execute automated unit tests against the generated database schema and API specifications using mock runners. Failures should feed into a "Self-Repair Sub-Graph" that iterates generation with updated constraints.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `database_schema` and `api_specs`, runs tests, returns `test_results` and `failure_details`.
        *   **Internal Mock Runner:** Executes tests against the generated specs.
        *   **Self-Repair Sub-Graph:** Triggers a sub-graph that re-invokes relevant design agents with error feedback.
    *   **Permissions & Authentication Layers:** N/A (internal).
    *   **Data Table Integrations:**
        *   **LangGraph State:** Updates `ProjectState` with test results and error messages.
    *   **Triggers & Event Logic:**
        *   **Rubric Scoring Completion:** Triggered after rubric scoring.
        *   **Test Failure:** Triggers the "Self-Repair Sub-Graph".
*   **Frontend (UI & Interface):** N/A (internal process).
*   **End-to-End Testing Criteria:**
    *   Verify that mock tests correctly identify errors in generated schemas/APIs.
    *   Verify that test failures correctly trigger the "Self-Repair Sub-Graph".
    *   Verify that the self-repair mechanism can iterate and fix simple errors.

---

**Development Unit: 7.3 Stress-Test Edge-Case Flows**

*   **Description:** Implement a series of tests to stress-test the entire system with various edge-case flows, including insufficient input, contradictory HITL feedback, illogical sequence requests, token overflow handling, and alternative data formats.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Orchestrates various test scenarios.
        *   **Internal System Calls:** Simulates user input, HITL feedback, etc.
    *   **Permissions & Authentication Layers:** N/A (internal).
    *   **Data Table Integrations:**
        *   **LangGraph State:** Records outcomes of stress tests.
    *   **Triggers & Event Logic:**
        *   **Unit Test Completion:** Triggered after unit tests pass.
*   **Frontend (UI & Interface):** N/A (internal process).
*   **End-to-End Testing Criteria:**
    *   Verify system resilience to insufficient/contradictory input.
    *   Verify correct handling of token overflow scenarios.
    *   Verify graceful degradation or error handling for illogical requests.
    *   Verify system behavior with alternative data formats.

---

**Development Unit: 7.4 Record Metrics**

*   **Description:** Implement logging and storage of key performance metrics, including success rate, recovery time from errors, and nesting depth statistics, for retrospection and continuous improvement.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Collects metrics from `ProjectState` and LangSmith.
        *   **Metrics Storage API:** `POST /api/metrics/store`: To persist metrics.
    *   **Permissions & Authentication Layers:**
        *   **Metrics Database Access:** Credentials for the metrics database.
    *   **Data Table Integrations:**
        *   **Metrics Database:** `system_metrics` table
            *   **Fields:** `id (PK)`, `graph_run_id (FK)`, `success_rate`, `recovery_time_s`, `nesting_depth_avg`, `timestamp`.
    *   **Triggers & Event Logic:**
        *   **Graph Completion/Failure:** Triggered at the end of each full graph run.
*   **Frontend (UI & Interface):** N/A (internal process, metrics viewed in dashboard).
*   **End-to-End Testing Criteria:**
    *   Verify that metrics are accurately collected and stored.
    *   Verify that metrics are accessible for reporting.

---

### **Epic 8: Output Graph**

**Description:** Develop the final sub-graph responsible for bundling the versioned documentation, notifying reviewers, and publishing artifacts to a shared portal upon final sign-off.

---

**Development Unit: 8.1 Compiler Agent**

*   **Description:** Create an agent that bundles all versioned documents into the code repository and emits a signed release tag upon final pass.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Node:** Receives `documentation_files`, performs bundling.
        *   **Git API:** `POST /api/git/tag`: To create a signed release tag.
        *   **File System Operations:** To organize and bundle files.
    *   **Permissions & Authentication Layers:**
        *   **Git Access:** Write access to the repository for tagging.
    *   **Data Table Integrations:**
        *   **Code Repository:** Final destination for bundled documentation.
    *   **Triggers & Event Logic:**
        *   **Validation & Robustness Graph Completion:** Triggered after all validation passes.
*   **Frontend (UI & Interface):** N/A (internal process).
*   **End-to-End Testing Criteria:**
    *   Verify that documentation is correctly bundled into the repository.
    *   Verify that a signed release tag is successfully created.

---

**Development Unit: 8.2 Notify HITL Reviewers for Final Sign-off & Publish Artifacts**

*   **Description:** Notify HITL reviewers for final sign-off of the complete documentation suite. Upon approval, trigger the CI pipeline to publish artifacts to a shared documentation portal.
*   **Backend (API & Data):**
    *   **API Operations:**
        *   **Internal LangGraph Interrupt:** Emits an `Interrupt` state for final review.
        *   **Notification API:** `POST /api/notifications/send`: To alert reviewers.
        *   **HITL Approval API:** `POST /api/hitl/final-signoff`: Endpoint for reviewer decision (as defined in 2.3).
        *   **CI/CD Trigger API:** `POST /api/ci-cd/publish`: To trigger the publishing pipeline.
    *   **Permissions & Authentication Layers:**
        *   **HITL User Authentication & Authorization:** (As defined in 2.3).
        *   **CI/CD Service Account:** For publishing artifacts.
    *   **Data Table Integrations:**
        *   **LangGraph State:** Persists `ProjectState` during interrupt.
        *   **Review Queue Table:** Records final review request and decision.
    *   **Triggers & Event Logic:**
        *   **Compiler Agent Completion:** Triggered after bundling.
        *   **Human Approval:** Triggers CI pipeline for publishing.
*   **Frontend (UI & Interface):**
    *   **UI Component:** `FinalSignoffDashboard` (similar to other HITL dashboards).
        *   **Display:** Presents the complete, bundled documentation.
        *   **Actions:** "Final Approve", "Request Revisions".
    *   **Interface Flow:**
        1.  System pauses for final sign-off.
        2.  Reviewer accesses dashboard, reviews.
        3.  Clicks "Final Approve" or "Request Revisions".
        4.  On approval, CI pipeline publishes.
*   **End-to-End Testing Criteria:**
    *   Verify that the system pauses for final sign-off.
    *   Verify that the complete documentation is accessible for review.
    *   Verify that "Final Approve" successfully triggers the CI pipeline for publishing.
    *   Verify that published artifacts are accessible on the documentation portal.
    *   Verify that "Request Revisions" routes back to relevant agents for updates.

---

### **Edge-Case Handling Embedded Throughout**

*   **Development Unit: Refinement/Assumption-Generation Sub-Graphs**
    *   **Description:** Implement generic sub-graphs that are conditionally triggered when validation fails or crucial information is missing. These sub-graphs either prompt for refinement (e.g., re-run an agent with new constraints) or generate reasonable assumptions for missing data.
    *   **Backend (API & Data):**
        *   **API Operations:** Internal LangGraph sub-graph invocation. LLM API for assumption generation.
        *   **Permissions:** LLM API key.
        *   **Data Table Integrations:** Updates `ProjectState` with refined data or generated assumptions.
        *   **Triggers:** Conditional edges from validation nodes.
    *   **Frontend (UI & Interface):** N/A (internal, or may involve a specific HITL for assumption review).
    *   **End-to-End Testing Criteria:** Verify that these sub-graphs are correctly invoked on failure and that they either refine or generate plausible assumptions.

*   **Development Unit: Tool-State Feature Integration**
    *   **Description:** Ensure that tool results (e.g., from Gemini search) directly update the graph state using LangGraph’s `tool-state` feature, enabling seamless data flow and decision-making.
    *   **Backend (API & Data):**
        *   **API Operations:** LangGraph `tool_executor` and state update mechanisms.
        *   **Permissions:** N/A.
        *   **Data Table Integrations:** Direct modification of `ProjectState`.
        *   **Triggers:** Tool execution completion.
    *   **Frontend (UI & Interface):** N/A.
    *   **End-to-End Testing Criteria:** Verify that tool outputs are correctly reflected in the `ProjectState` and influence subsequent agent decisions.

---

### **Human-in-the-Loop Checkpoints (Consolidated)**

*   **Development Unit: HITL Checkpoint Implementation (Generic)**
    *   **Description:** Standardize the implementation of HITL checkpoints across the system, triggered by confidence thresholds (< 0.8) or semantic conflicts, ensuring consistent human review processes.
    *   **Backend (API & Data):**
        *   **API Operations:** Standardized `Interrupt` emission, notification, and approval APIs (as defined in 2.3).
        *   **Permissions:** Standardized HITL user authentication and authorization.
        *   **Data Table Integrations:** Standardized `hitl_reviews` table.
        *   **Triggers:** Confidence thresholds, semantic conflict detection.
    *   **Frontend (UI & Interface):** Standardized `HITLReviewDashboard` components, adaptable to display specific `ProjectState` sections.
    *   **End-to-End Testing Criteria:** Verify consistent behavior, notification, and state management for all HITL checkpoints.

---

### **Sequencing & Timeline (Sprint-Level View - Refined)**

The provided sprint-level view is already excellent. Each sprint will focus on delivering the Epics/Development Units outlined above.

| Sprint | Main Graphs Delivered (Epics) | Key Outputs (Development Units) | HITL Reviews |
| :----- | :---------------------------- | :------------------------------ | :----------- |
| **1**  | **Environment & Infrastructure Setup**<br>**Core Orchestrator Implementation** | 1.1-1.4 (Repo, Secrets, Observability, Schemas)<br>2.1-2.3 (Orchestrator, Scheduling, HITL Core) | 0 |
| **2**  | **Input Ingestion Graph** | 3.1-3.3 (Parser, Validator, Clarification, InputSpec HITL) | 1 (InputSpec Approval) |
| **3**  | **Scoping Graph** | 4.1-4.3 (User Stories, Requirements, Conflict Detection) | 1 (Conflict Resolution HITL if needed) |
| **4**  | **Design Graph (Part A)** | 5.1-5.3 (Architecture, Schema, API Agent) | 0 |
| **5**  | **Design Graph (Part B)**<br>**Documentation Assembly Graph** | 5.4 (Agentic Workflow Sub-Graph)<br>5.5 (Design Packet HITL)<br>6.1-6.3 (Doc Assembler, Prompt Registry, Metadata Tagger) | 1 (Design Packet Approval) |
| **6**  | **Validation & Robustness Graph**<br>**Output Graph** | 7.1-7.4 (Rubric Scoring, Unit Tests, Stress Tests, Metrics)<br>8.1-8.2 (Compiler, Final Sign-off & Publish) | 1 (Final Sign-off) |

---

### **Completion Definition of Done (Reinforced)**

1.  All six main graphs (Epics) are fully implemented, integrated, and pass their respective end-to-end tests, with no unfinished or unhandled states.
2.  Documentation completeness score consistently achieves ≥ 90% across multiple test runs.
3.  The edge-case test suite passes with a median recovery time of < 30 seconds, demonstrating system robustness.
4.  All planned Human-in-the-Loop checkpoints are successfully integrated, tested, and approved by designated reviewers for a full project definition cycle.
5.  All defined API operations, permission layers, data table integrations, triggers, and UI components for each development unit are implemented and verified.

This detailed plan provides a granular, actionable roadmap for developing your Multi-Agent RAG System, ensuring modularity, testability, and effective collaboration between human and AI agents.