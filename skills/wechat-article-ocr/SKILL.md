---
name: wechat-article-ocr
description: 微信公众号文章图片OCR文字识别。使用Tesseract OCR引擎，支持中英文混合识别，适用于微信文章中的截图、表格、二维码说明文字等。
---

# 微信公众号图片OCR识别

从微信公众号文章图片中提取文字信息。

## 技术栈

| 组件 | 说明 |
|------|------|
| Tesseract OCR | 开源OCR引擎 |
| chi_sim.traineddata | 中文简体语言包 |
| eng.traineddata | 英文语言包 |
| opencv-python | 图像预处理 |

## 安装依赖

```bash
# 安装Tesseract
apt-get install -y tesseract tesseract-ocr

# 下载中文语言包
wget -O /usr/share/tesseract/tessdata/chi_sim.traineddata \
  https://github.com/tesseract-ocr/tessdata/raw/main/chi_sim.traineddata

# Python依赖
pip install pytesseract opencv-python pillow
```

## 使用方法

### 基础OCR

```python
import pytesseract
from PIL import Image

# 简单识别
text = pytesseract.image_to_string(image, lang='chi_sim+eng')
print(text)
```

### 图像预处理 + OCR

```python
import cv2
import pytesseract
from PIL import Image
import numpy as np

def ocr_image(image_path):
    # 读取图片
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Otsu阈值处理增强对比度
    _, thresh = cv2.threshold(gray, 0, 255, 
                               cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # OCR识别（中英文混合）
    text = pytesseract.image_to_string(thresh, 
                                       lang='chi_sim+eng',
                                       config='--psm 6')
    return text
```

## 关键参数

| 参数 | 说明 |
|------|------|
| `--psm 6` | 假设统一文本块 |
| `--psm 3` | 自动分段（默认） |
| `--psm 4` | 单一文本列 |
| `lang='chi_sim+eng'` | 中英文混合 |

## 完整示例

```python
import cv2
import pytesseract

def ocr_wechat_image(image_path):
    """
    微信公众号图片OCR识别
    适用于：截图、表格、二维码说明、照片等
    """
    # 读取并预处理
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 增强对比度
    _, thresh = cv2.threshold(
        gray, 0, 255, 
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    
    # OCR识别
    text = pytesseract.image_to_string(
        thresh, 
        lang='chi_sim+eng',
        config='--psm 6'
    )
    
    return text

# 使用
result = ocr_wechat_image("path/to/image.jpg")
print(result)
```

## 注意事项

1. **图片质量**：模糊、有水印的图片识别率低
2. **语言包**：必须下载 `chi_sim.traineddata` 才能识别中文
3. **二维码**：二维码本身无法OCR，需要另外的二维码识别工具
4. **表格**：复杂表格建议先手动整理

## 微信图片特点

- 截图/照片为主，分辨率不一定高
- 可能有水印覆盖
- 文字可能倾斜或变形
- 建议先做图像预处理

## 相关工具

- **二维码识别**: `pip install pyzbar`
- **PDF OCR**: `pdftotext` + Tesseract
- **批量处理**: OpenCV + 多线程
