const { clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取桌面路径
function getDesktopPath() {
  return path.join(os.homedir(), 'Desktop');
}

// 生成文件名
function generateFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `文本_${year}${month}${day}_${hour}${minute}${second}.txt`;
}

// 保存文本到桌面
function saveTextToDesktop(text) {
  try {
    const desktopPath = getDesktopPath();
    const fileName = generateFileName();
    const filePath = path.join(desktopPath, fileName);
    
    fs.writeFileSync(filePath, text, 'utf8');
    
    return {
      success: true,
      fileName: fileName
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

window.exports = {
  "generate_txt": {
    mode: "list",
    args: {
      enter: (action, callbackSetList) => {
        // 获取剪贴板内容
        const clipboardText = clipboard.readText();
        
        if (!clipboardText || clipboardText.trim() === '') {
          callbackSetList([
            {
              title: "剪贴板为空",
              description: "请先复制一些文本内容",
              icon: "logo.png"
            }
          ]);
          return;
        }
        
        // 格式化预览文本
        const preview = clipboardText.length > 50 ? 
          clipboardText.substring(0, 50) + '...' : 
          clipboardText;
        
        callbackSetList([
          {
            title: "生成txt文件到桌面",
            description: `保存 ${clipboardText.length} 个字符: ${preview.replace(/\n/g, ' ')}`,
            icon: "logo.png"
          }
        ]);
      },
      select: () => {
        // 获取剪贴板内容
        const clipboardText = clipboard.readText();
        
        if (!clipboardText || clipboardText.trim() === '') {
          utools.showNotification('剪贴板为空，请先复制文本内容');
          return;
        }
        
        // 保存文件
        const result = saveTextToDesktop(clipboardText);
        
        if (result.success) {
          utools.showNotification(`文件已保存到桌面: ${result.fileName}`);
        } else {
          utools.showNotification(`保存失败: ${result.error}`);
        }
        
        utools.hideMainWindow();
      }
    }
  }
};