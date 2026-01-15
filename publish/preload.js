const { clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getDesktopPath() {
  return path.join(os.homedir(), 'Desktop');
}

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

function saveTextToPath(text, filePath) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, text, 'utf8');
    
    return {
      success: true,
      fileName: path.basename(filePath),
      filePath: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function saveTextToDesktop(text, customName = null) {
  const desktopPath = getDesktopPath();
  const fileName = customName || generateFileName();
  const filePath = path.join(desktopPath, fileName);
  return saveTextToPath(text, filePath);
}

function ensureTxtExtension(filePath) {
  return path.extname(filePath) ? filePath : `${filePath}.txt`;
}

function getClipboardTextOrNull() {
  const text = clipboard.readText();
  if (!text || text.trim() === '') return null;
  return text;
}

function safeNotify(text) {
  if (typeof utools === 'undefined') return;
  if (typeof utools.showNotification !== 'function') return;
  utools.showNotification(text);
}

function safeExit() {
  if (typeof utools === 'undefined') return;
  if (typeof utools.hideMainWindow === 'function') utools.hideMainWindow();
  if (typeof utools.outPlugin === 'function') utools.outPlugin();
}

function handleAction(action) {
  const clipboardText = getClipboardTextOrNull();
  if (!clipboardText) {
    safeNotify('剪贴板为空，请先复制文本内容');
    safeExit();
    return;
  }

  const code = action && action.code ? String(action.code) : '';

  if (code === 'save_desktop') {
    const result = saveTextToDesktop(clipboardText);
    if (result.success) {
      safeNotify(`文件已保存到桌面: ${result.fileName}`);
    } else {
      safeNotify(`保存失败: ${result.error}`);
    }
    safeExit();
    return;
  }

  if (typeof utools === 'undefined') return;

  if (code === 'save_custom_name') {
    const savePath = utools.showSaveDialog({
      title: '保存到桌面',
      defaultPath: path.join(getDesktopPath(), '文本.txt'),
      buttonLabel: '保存'
    });
    if (!savePath) return;
    const filePath = ensureTxtExtension(savePath);
    const result = saveTextToPath(clipboardText, filePath);
    if (result.success) {
      safeNotify(`文件已保存: ${result.filePath}`);
      safeExit();
    } else {
      safeNotify(`保存失败: ${result.error}`);
    }
    return;
  }

  if (code === 'save_custom_path') {
    const selected = utools.showOpenDialog({
      title: '选择保存文件夹',
      properties: ['openDirectory', 'createDirectory']
    });
    const dirPath = Array.isArray(selected) && selected.length > 0 ? selected[0] : null;
    if (!dirPath) return;
    const filePath = path.join(dirPath, generateFileName());
    const result = saveTextToPath(clipboardText, filePath);
    if (result.success) {
      safeNotify(`文件已保存: ${result.filePath}`);
      safeExit();
    } else {
      safeNotify(`保存失败: ${result.error}`);
    }
    return;
  }

  if (code === 'save_custom_both') {
    const savePath = utools.showSaveDialog({
      title: '选择保存路径',
      defaultPath: path.join(getDesktopPath(), generateFileName()),
      buttonLabel: '保存'
    });
    if (!savePath) return;
    const filePath = ensureTxtExtension(savePath);
    const result = saveTextToPath(clipboardText, filePath);
    if (result.success) {
      safeNotify(`文件已保存: ${result.filePath}`);
      safeExit();
    } else {
      safeNotify(`保存失败: ${result.error}`);
    }
    return;
  }

  const fallback = saveTextToDesktop(clipboardText);
  if (fallback.success) {
    safeNotify(`文件已保存到桌面: ${fallback.fileName}`);
  } else {
    safeNotify(`保存失败: ${fallback.error}`);
  }
  safeExit();
}

if (typeof utools !== 'undefined' && typeof utools.onPluginEnter === 'function') {
  utools.onPluginEnter((action) => {
    try {
      if (typeof utools.hideMainWindow === 'function') utools.hideMainWindow();
      handleAction(action);
    } catch (e) {
      safeNotify(`执行失败: ${e && e.message ? e.message : String(e)}`);
      safeExit();
    }
  });
}
