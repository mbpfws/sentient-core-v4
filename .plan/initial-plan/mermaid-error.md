Diagram Rendering Error
Parse error on line 14: ... direction TD UserS -----------------------^ Expecting 'SEMI', 'NEWLINE', 'EOF', 'AMP', 'START_LINK', 'LINK', 'LINK_ID', got 'NODE_STRING'
Cloud Storage
MongoDB
Cloud SQL (PostgreSQL)
Custom ML Models (Vertex AI)
Google AI (Gemini/STT/TTS)
AI Orchestration Service
Content Management Service
IELTS Session Service
API Gateway
Ứng dụng di động
Người dùng
Cloud Storage
MongoDB
Cloud SQL (PostgreSQL)
Custom ML Models (Vertex AI)
Google AI (Gemini/STT/TTS)
AI Orchestration Service
Content Management Service
IELTS Session Service
API Gateway
Ứng dụng di động
Người dùng
Kịch bản 1: Bắt đầu phiên & Tạo câu hỏi
Kịch bản 2: Người dùng trả lời & Phân tích phản hồi
1. Khởi động ứng dụng
2. Yêu cầu đăng nhập/đăng ký (qua Firebase Auth SDK)
3. Token JWT
4. POST /sessions/start (kèm JWT)
5. Chuyển tiếp yêu cầu (xác minh JWT)
6. GET /content/questions (lấy chủ đề/cấu hình)
7. Chủ đề/cấu hình câu hỏi
8. POST /ai/generate-question (chủ đề, loại câu hỏi)
9. Gọi Gemini API (Prompt: "Tạo câu hỏi IELTS Part X")
10. Câu hỏi văn bản
11. Gọi TTS API (chuyển văn bản thành âm thanh)
12. Lưu tệp âm thanh (tùy chọn) & trả về URL được ký
13. Câu hỏi văn bản + URL âm thanh
14. Lưu trạng thái phiên (meta-data)
15. Câu hỏi văn bản + URL âm thanh
16. Phát âm thanh câu hỏi
17. Ghi âm câu trả lời (âm thanh)
18. POST /ai/answer (âm thanh câu trả lời, sessionId)
19. Chuyển tiếp âm thanh câu trả lời
20. Gọi STT API (chuyển âm thanh thành văn bản)
21. Văn bản câu trả lời
22. Gọi Gemini API (phân tích nội dung, ý tưởng)
23. Gửi văn bản/âm thanh cho Custom ML Models (phát âm, ngữ pháp, từ vựng, mạch lạc)
24. Kết quả phân tích chi tiết (pronunciation, grammar, etc.)
25. Kết quả phân tích nội dung (task achievement, cohesion)
26. Lưu phản hồi chi tiết AI (JSON)
27. Cập nhật tóm tắt phiên (overall score, etc.)
28. Phản hồi chi tiết (văn bản)
29. Hiển thị phản hồi chi tiết
Diagram Rendering Error
Lexical error on line 9. Unrecognized text. ... AuthEP[/auth/*] UserEP -----------------------^
has

made

tracks

includes

used_in

USERS

UUID

id

PK

UUID

VARCHAR

email

Unique email

VARCHAR

password_hash

Hashed password

VARCHAR

display_name

User's display name

TIMESTAMP

created_at

Creation timestamp

TIMESTAMP

updated_at

Last update timestamp

VARCHAR

role

User role (free, premium, admin)

VARCHAR

subscription_status

Subscription status (active, expired)

IELTS_SESSIONS

UUID

id

PK

UUID

UUID

user_id

FK

FK to USERS

TIMESTAMP

session_start_time

Session start time

TIMESTAMP

session_end_time

Session end time

JSONB

part1_questions

Array of Part 1 question IDs/text

JSONB

part2_question

Part 2 question ID/text

JSONB

part3_questions

Array of Part 3 question IDs/text

DECIMAL

overall_score

Overall score for the session

VARCHAR

status

Session status (in_progress, completed, cancelled)

INTEGER

total_duration_seconds

Total duration of session

TIMESTAMP

created_at

Creation timestamp

QUESTIONS

UUID

id

PK

UUID

VARCHAR

part_type

IELTS Speaking Part (Part1, Part2, Part3)

VARCHAR

topic

Topic of the question

TEXT

text

Question text

JSONB

expected_answer_keywords

Keywords for content validation

TIMESTAMP

created_at

Creation timestamp

PAYMENTS

UUID

id

PK

UUID

UUID

user_id

FK

FK to USERS

DECIMAL

amount

Payment amount

VARCHAR

currency

Currency (e.g., USD, VND)

TIMESTAMP

transaction_date

Date of transaction

VARCHAR

status

Transaction status (pending, completed, failed)

VARCHAR

payment_gateway_id

ID from payment gateway

FEEDBACK_DETAILS

UUID

sessionId

PK

FK to IELTS_SESSIONS

UUID

userId

User ID for quick lookup

UUID

questionId

Question ID from QUESTIONS

VARCHAR

original_audio_url

URL to user's recorded audio in Cloud Storage

TEXT

transcription_text

STT transcription of user's answer

JSONB

gemini_response_json

Full JSON response from Gemini API

JSONB

pronunciation_analysis_json

Detailed pronunciation analysis

JSONB

grammar_analysis_json

Detailed grammar analysis

JSONB

vocabulary_analysis_json

Detailed vocabulary analysis

JSONB

coherence_analysis_json

Detailed coherence & cohesion analysis

TIMESTAMP

generated_at

Timestamp of feedback generation

USER_PROGRESS_METRICS

UUID

userId

PK

FK to USERS

DATE

date

PK

Date of metric aggregation

JSONB

overall_score_trend

Trend of overall scores over time

JSONB

detailed_score_trend_by_criteria

Trend of scores for each criteria

JSONB

common_errors_summary

Summary of recurring errors

Diagram Rendering Error
Parse error on line 4: ...rce Code Repository (Cloud Source Reposi -----------------------^ Expecting 'SQE', 'DOUBLECIRCLEEND', 'PE', '-)', 'STADIUMEND', 'SUBROUTINEEND', 'PIPE', 'CYLINDEREND', 'DIAMOND_STOP', 'TAGEND', 'TRAPEND', 'INVTRAPEND', 'UNICODE_TEXT', 'TEXT', 'TAGSTART', got 'PS'
Diagram Rendering Error
Parse error on line 7: ... B[API Gateway (Cloud Endpoints)] -----------------------^ Expecting 'SQE', 'DOUBLECIRCLEEND', 'PE', '-)', 'STADIUMEND', 'SUBROUTINEEND', 'PIPE', 'CYLINDEREND', 'DIAMOND_STOP', 'TAGEND', 'TRAPEND', 'INVTRAPEND', 'UNICODE_TEXT', 'TEXT', 'TAGSTART', got 'PS'