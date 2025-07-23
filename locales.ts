export const locales = {
    en: {
        headerTitle: "Sentient Core V. Beta",
        resetProject: "Reset Project",
        resetConfirmation: "Are you sure you want to reset the current project? All its data will be lost.",
        backToProjects: "Back to Projects",
        settings: "Settings",

        // API Key Modal
        apiKeyModalTitle: "Set Your Gemini API Key",
        apiKeyModalDescription: "To use this application, you need to provide your own Google Gemini API key. Your key will be stored locally in your browser and will not be shared.",
        apiKeyModalInputPlaceholder: "Enter your API key here",
        apiKeyModalSaveButton: "Save Key",
        apiKeyModalLink: "Get an API key from Google AI Studio",

        // Project Manager
        projectManagerTitle: "Project Manager",
        createNewProject: "Create New Project",
        deleteProject: "Delete Project",
        deleteProjectConfirmation: "Are you sure you want to delete this project? This action cannot be undone.",
        noProjects: "No projects yet. Create one to get started!",

        // Project Input
        defineProjectTitle: "Define Your New Project",
        defineProjectDescription: "Describe your application idea in natural language. The orchestrator will generate the project documentation.",
        projectInputPlaceholder: "e.g., 'A platform for local chefs to sell homemade meals...'",
        startGeneration: "Start Generation",
        cancel: "Cancel",
        initializing: "Initializing...",
        trySample: "Or try a sample project:",
        sampleProjects: [
            "An AI-powered tutoring SAAS platform for high school students.",
            "A mobile app for tracking personal carbon footprint with social sharing features.",
            "A real-time collaborative whiteboard application using WebSockets.",
            "A decentralized marketplace for digital art using blockchain technology.",
        ],

        // Workspace
        workflowView: "Workflow View",
        explorerView: "Explorer View",
        
        // Workflow Visualizer
        workflowGraphTitle: "Workflow Graph",
        
        // Document Viewer
        selectNodePrompt: "Select a document from the explorer to view its details and chat.",
        synthesizedBrief: "Synthesized Brief",
        taskOutline: "Task Outline",
        finalDocument: "Final Document",
        notGenerated: "Not yet generated.",
        sourcesTitle: "Sources (from Google Search):",
        reviewTitle: "Human-in-the-Loop Review:",
        reviewDescription: "Please review the {stage} above. Approve to continue, or reject with feedback to refine it.",
        feedbackPlaceholder: "Provide feedback for {stage} refinement...",
        approveButton: "Approve {stage}",
        rejectButton: "Reject & Refine",
        stageOutline: "Outline",
        stageDocument: "Final Document",

        // Document Explorer
        explorerTitle: "Document Explorer",
        searchDocs: "Search documents...",
        filterByStatus: "Filter by status...",
        sortBy: "Sort by...",
        sortNewest: "Newest First",
        sortOldest: "Oldest First",
        sortAZ: "Title (A-Z)",
        sortZA: "Title (Z-A)",
        noDocsMatch: "No documents match your criteria.",
        
        // Chat Panel
        chatPanelTitle: "Context-Aware Chat",
        chatPlaceholder: "Ask about this document...",
        sendMessage: "Send",
        chatWelcome: "Ask me anything about this document or its related components. I have context from its parent and sibling nodes.",
        
        // Edge Case Simulator
        edgeCaseTitle: "Edge Case Demonstrations",
        edgeCaseDescription: "Use these buttons to demonstrate how the orchestrator handles unexpected situations during the workflow.",
        simulateAmbiguous: "Simulate Ambiguous Input",
        simulateConflict: "Simulate Conflicting Feedback",
        simulateTokenLimit: "Simulate Token Limit",
        simulateFailure: "Simulate Agent Failure",
        alertFailure: "Simulated a failure on node: {nodeLabel}. Workflow halted.",
        alertNoActiveNode: "No active node to fail. Start a workflow first.",

        // Enhanced UI Components
        documentManagement: "Document Management",
        searchDocuments: "Search documents...",
        filterByType: "Filter by type",
        allTypes: "All Types",
        svgType: "SVG",
        mermaidType: "Mermaid",
        markdownType: "Markdown",
        textType: "Text",
        sortByName: "Name",
        sortByDate: "Date",
        sortBySize: "Size",
        sortByType: "Type",
        ascending: "Ascending",
        descending: "Descending",
        itemsPerPage: "Items per page",
        showingItems: "Showing {start}-{end} of {total} items",
        previousPage: "Previous",
        nextPage: "Next",
        selectAll: "Select All",
        clearSelection: "Clear Selection",
        exportSelected: "Export Selected",
        deleteSelected: "Delete Selected",
        exportAsZip: "Export as ZIP",
        exportAsJson: "Export as JSON",
        confirmDelete: "Are you sure you want to delete {count} selected document(s)?",
        noDocumentsFound: "No documents found",
        
        // Workflow Visualizer
        zoomIn: "Zoom In",
        zoomOut: "Zoom Out",
        resetZoom: "Reset Zoom",
        fitToView: "Fit to View",
        toggleGrid: "Toggle Grid",
        layoutType: "Layout Type",
        hierarchicalLayout: "Hierarchical",
        circularLayout: "Circular",
        forceDirectedLayout: "Force-Directed",
        nodesCount: "Nodes: {count}",
        edgesCount: "Edges: {count}",
        zoomLevel: "Zoom: {level}%",
        
        // Document Explorer
        graphView: "Graph View",
        listView: "List View",
        gridView: "Grid View",
        toggleView: "Toggle View",
        
        // Document Viewer
        documentDetails: "Document Details",
        contentPreview: "Content Preview",
        reviewControls: "Review Controls",
        expandSection: "Expand Section",
        collapseSection: "Collapse Section"
    },
    vi: {
        headerTitle: "Không gian làm việc thông minh",
        resetProject: "Khởi động lại Dự án",
        resetConfirmation: "Bạn có chắc chắn muốn khởi động lại dự án hiện tại không? Mọi dữ liệu của nó sẽ bị mất.",
        backToProjects: "Quay lại Danh sách Dự án",
        settings: "Cài đặt",

        // API Key Modal
        apiKeyModalTitle: "Đặt Khóa API Gemini của bạn",
        apiKeyModalDescription: "Để sử dụng ứng dụng này, bạn cần cung cấp khóa API Google Gemini của riêng mình. Khóa của bạn sẽ được lưu trữ cục bộ trong trình duyệt và sẽ không được chia sẻ.",
        apiKeyModalInputPlaceholder: "Nhập khóa API của bạn tại đây",
        apiKeyModalSaveButton: "Lưu Khóa",
        apiKeyModalLink: "Lấy khóa API từ Google AI Studio",

        // Project Manager
        projectManagerTitle: "Quản lý Dự án",
        createNewProject: "Tạo dự án mới",
        deleteProject: "Xóa dự án",
        deleteProjectConfirmation: "Bạn có chắc chắn muốn xóa dự án này không? Hành động này không thể hoàn tác.",
        noProjects: "Chưa có dự án nào. Hãy tạo một dự án để bắt đầu!",

        // Project Input
        defineProjectTitle: "Định nghĩa Dự án Mới của Bạn",
        defineProjectDescription: "Mô tả ý tưởng ứng dụng của bạn bằng ngôn ngữ tự nhiên. Bộ điều phối sẽ tạo tài liệu dự án.",
        projectInputPlaceholder: "ví dụ: 'Một nền tảng cho các đầu bếp địa phương bán các bữa ăn tự làm...'",
        startGeneration: "Bắt đầu Tạo",
        cancel: "Hủy",
        initializing: "Đang khởi tạo...",
        trySample: "Hoặc thử một dự án mẫu:",
        sampleProjects: [
            "Một nền tảng SAAS dạy kèm bằng AI cho học sinh trung học.",
            "Một ứng dụng di động để theo dõi lượng khí thải carbon cá nhân với các tính năng chia sẻ xã hội.",
            "Một ứng dụng bảng trắng cộng tác thời gian thực sử dụng WebSockets.",
            "Một thị trường phi tập trung cho nghệ thuật kỹ thuật số sử dụng công nghệ blockchain.",
        ],

        // Workspace
        workflowView: "Xem Quy trình",
        explorerView: "Xem Tài liệu",
        
        // Workflow Visualizer
        workflowGraphTitle: "Sơ đồ Quy trình",
        
        // Document Viewer
        selectNodePrompt: "Chọn một tài liệu từ trình khám phá để xem chi tiết và trò chuyện.",
        synthesizedBrief: "Bản tóm tắt Tổng hợp",
        taskOutline: "Đề cương Nhiệm vụ",
        finalDocument: "Tài liệu Hoàn chỉnh",
        notGenerated: "Chưa được tạo.",
        sourcesTitle: "Nguồn (từ Google Search):",
        reviewTitle: "Đánh giá của Người dùng:",
        reviewDescription: "Vui lòng xem lại {stage} ở trên. Phê duyệt để tiếp tục, hoặc từ chối kèm phản hồi để tinh chỉnh.",
        feedbackPlaceholder: "Cung cấp phản hồi để tinh chỉnh {stage}...",
        approveButton: "Phê duyệt {stage}",
        rejectButton: "Từ chối & Tinh chỉnh",
        stageOutline: "Đề cương",
        stageDocument: "Tài liệu",

        // Document Explorer
        explorerTitle: "Trình khám phá Tài liệu",
        searchDocs: "Tìm kiếm tài liệu...",
        filterByStatus: "Lọc theo trạng thái...",
        sortBy: "Sắp xếp theo...",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortAZ: "Tiêu đề (A-Z)",
        sortZA: "Tiêu đề (Z-A)",
        noDocsMatch: "Không có tài liệu nào phù hợp.",
        
        // Chat Panel
        chatPanelTitle: "Trò chuyện Nhận biết Ngữ cảnh",
        chatPlaceholder: "Hỏi về tài liệu này...",
        sendMessage: "Gửi",
        chatWelcome: "Hãy hỏi tôi bất cứ điều gì về tài liệu này hoặc các thành phần liên quan. Tôi có ngữ cảnh từ các nút cha và anh em của nó.",

        // Edge Case Simulator
        edgeCaseTitle: "Mô phỏng Tình huống Đặc biệt",
        edgeCaseDescription: "Sử dụng các nút này để mô phỏng cách bộ điều phối xử lý các tình huống không mong muốn trong quá trình làm việc.",
        simulateAmbiguous: "Mô phỏng Đầu vào Mơ hồ",
        simulateConflict: "Mô phỏng Phản hồi Mâu thuẫn",
        simulateTokenLimit: "Mô phỏng Giới hạn Token",
        simulateFailure: "Mô phỏng Tác tử Thất bại",
        alertFailure: "Đã mô phỏng lỗi trên nút: {nodeLabel}. Quy trình đã bị dừng.",
        alertNoActiveNode: "Không có nút nào đang hoạt động để gây lỗi. Hãy bắt đầu một quy trình trước.",

        // Enhanced UI Components
        documentManagement: "Quản lý Tài liệu",
        searchDocuments: "Tìm kiếm tài liệu...",
        filterByType: "Lọc theo loại",
        allTypes: "Tất cả Loại",
        svgType: "SVG",
        mermaidType: "Mermaid",
        markdownType: "Markdown",
        textType: "Văn bản",
        sortByName: "Tên",
        sortByDate: "Ngày",
        sortBySize: "Kích thước",
        sortByType: "Loại",
        ascending: "Tăng dần",
        descending: "Giảm dần",
        itemsPerPage: "Mục trên mỗi trang",
        showingItems: "Hiển thị {start}-{end} trong tổng số {total} mục",
        previousPage: "Trước",
        nextPage: "Tiếp",
        selectAll: "Chọn Tất cả",
        clearSelection: "Bỏ chọn",
        exportSelected: "Xuất đã chọn",
        deleteSelected: "Xóa đã chọn",
        exportAsZip: "Xuất dưới dạng ZIP",
        exportAsJson: "Xuất dưới dạng JSON",
        confirmDelete: "Bạn có chắc chắn muốn xóa {count} tài liệu đã chọn không?",
        noDocumentsFound: "Không tìm thấy tài liệu",
        
        // Workflow Visualizer
        zoomIn: "Phóng to",
        zoomOut: "Thu nhỏ",
        resetZoom: "Đặt lại Zoom",
        fitToView: "Vừa với Màn hình",
        toggleGrid: "Bật/Tắt Lưới",
        layoutType: "Kiểu Bố cục",
        hierarchicalLayout: "Phân cấp",
        circularLayout: "Hình tròn",
        forceDirectedLayout: "Lực hướng",
        nodesCount: "Nút: {count}",
        edgesCount: "Cạnh: {count}",
        zoomLevel: "Zoom: {level}%",
        
        // Document Explorer
        graphView: "Xem Đồ thị",
        listView: "Xem Danh sách",
        gridView: "Xem Lưới",
        toggleView: "Chuyển đổi Xem",
        
        // Document Viewer
        documentDetails: "Chi tiết Tài liệu",
        contentPreview: "Xem trước Nội dung",
        reviewControls: "Điều khiển Đánh giá",
        expandSection: "Mở rộng Phần",
        collapseSection: "Thu gọn Phần"
    }
};