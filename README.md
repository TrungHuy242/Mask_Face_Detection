# 🎭 MaskGuard AI - Phát Hiện Khẩu Trang Bằng AI

Ứng dụng AI thông minh giúp phát hiện người đeo khẩu trang đúng cách, đeo sai hoặc không đeo – hỗ trợ cả upload ảnh và webcam real-time với độ chính xác cực cao.

![Mask Detection AI](https://img.shields.io/badge/AI-Mask%20Detection-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange)

## ✨ Tính năng

- 📸 **Upload Ảnh**: Kéo thả hoặc chọn ảnh từ máy tính, AI sẽ phân tích ngay lập tức
- 🎥 **Webcam Real-time**: Phát hiện khẩu trang trực tiếp từ camera với tốc độ cao
- 🎯 **3 Loại Phát Hiện**:
  - ✅ Đeo đúng cách (with_mask)
  - ❌ Không đeo (without_mask)
  - ⚠️ Đeo sai cách (mask_weared_incorrect)
- 📊 **Thống kê Real-time**: Hiển thị số lượng người trong từng trạng thái
- 🎨 **Giao diện Hiện đại**: UI/UX đẹp mắt với animations mượt mà
- 🌙 **Dark Mode Support**: Hỗ trợ chế độ tối

## 🏗️ Kiến trúc

Dự án được chia thành 2 phần:

### Frontend (Next.js 16)
- Framework: Next.js 16 với React 19
- Styling: CSS Modules với animations
- Real-time: WebSocket cho webcam detection
- Location: `mask-ai-frontend/`

### Backend (FastAPI)
- Framework: FastAPI với Python
- AI Model: TensorFlow/Keras (MobileNetV2 based)
- Face Detection: Haar Cascade
- Real-time: WebSocket support
- Location: `backend/`

## 🚀 Cài đặt và Chạy Local

### Yêu cầu

- Node.js 18+ và npm/yarn
- Python 3.9+
- Camera (cho tính năng webcam)

### Bước 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Bước 2: Setup Backend

```bash
cd backend

# Tạo virtual environment (khuyến nghị)
python -m venv venv

# Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server
uvicorn main:app --reload --port 8000
```

Backend sẽ chạy tại: `http://localhost:8000`

### Bước 3: Setup Frontend

Mở terminal mới:

```bash
cd mask-ai-frontend

# Cài đặt dependencies
npm install
# hoặc
yarn install

# Chạy development server
npm run dev
# hoặc
yarn dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc Dự án

```
Train/
├── backend/                 # FastAPI Backend
│   ├── main.py             # FastAPI app chính
│   ├── requirements.txt    # Python dependencies
│   ├── models/             # AI Model files
│   │   ├── mask_detector_v1.keras
│   │   └── haarcascade_frontalface_default.xml
│   └── utils/              # Utility functions
│       ├── predict.py      # Prediction logic
│       └── face_detect.py  # Face detection
│
├── mask-ai-frontend/       # Next.js Frontend
│   ├── app/                # Next.js app directory
│   │   ├── page.tsx        # Trang chủ
│   │   ├── upload/         # Trang upload ảnh
│   │   ├── webcam/         # Trang webcam real-time
│   │   └── components/     # React components
│   ├── package.json
│   └── tsconfig.json
│
├── image_test/             # Test images
├── .gitignore
└── README.md
```

## 🔧 Cấu hình

### Backend

File `backend/main.py` đã được cấu hình với CORS để cho phép frontend kết nối. Nếu cần thay đổi:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Thêm domain của bạn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend

Tạo file `mask-ai-frontend/.env.local` (không commit file này):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## 🛠️ Công nghệ sử dụng

### Frontend
- **Next.js 16**: React framework
- **TypeScript**: Type safety
- **CSS Modules**: Scoped styling
- **WebSocket**: Real-time communication

### Backend
- **FastAPI**: Modern Python web framework
- **TensorFlow/Keras**: Deep learning
- **OpenCV**: Image processing
- **Haar Cascade**: Face detection
- **WebSocket**: Real-time communication

## 📝 API Endpoints

### POST `/detect`
Upload ảnh và nhận kết quả detection

**Request:**
```bash
curl -X POST "http://localhost:8000/detect" \
  -F "file=@image.jpg"
```

**Response:**
```json
{
  "predictions": [
    {
      "bbox": [100, 100, 200, 200],
      "label": "with_mask",
      "confidence": 0.95
    }
  ]
}
```

### WebSocket `/ws`
Real-time detection qua WebSocket

**Message Format:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "predictions": [...]
}
```

## 🤝 Đóng góp

Contributions are welcome! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request


## 👨‍💻 Tác giả

Created with ❤️ using AI and modern web technologies.

## 🙏 Acknowledgments

- TensorFlow team cho deep learning framework
- FastAPI team cho web framework
- Next.js team cho React framework
- OpenCV community cho computer vision tools

## 📞 Liên hệ

Nếu có câu hỏi hoặc gặp vấn đề, vui lòng mở issue trên GitHub.

---

⭐ Nếu dự án này hữu ích, hãy cho một star!

