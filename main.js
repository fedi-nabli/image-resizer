const path = require('path')
const os = require('os')
const fs = require('fs')
const resizeImg = require('resize-img')
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')

const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'

let mainWindow
let aboutWindow

// Create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Image Resizer',
    width: isDev ? 1000 : 500,
    height: 600,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Open devtools if in dev env
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'))
}

// About window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: 'About Image Resizer'
  })

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'))
}

// App is ready
app.whenReady().then(() => {
  createMainWindow()

  // Implement menu
  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)

  // Remove main window from memory on close
  mainWindow.on('closed', () => mainWindow = null)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// Menu template
const menu = [
  ...(isMac
    ? [
      {
        label: app.name,
        submenu: [
          {
            label: 'About',
            click: createAboutWindow
          },
          {
            label: 'Quit',
            click: () => app.quit(),
            accelerator: 'Cmd+Q'
          }
        ]
      }
    ]
    : []
  ),
  {
    role: 'fileMenu'
  },
  ...(!isMac
    ? [
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: createAboutWindow
          }
        ]
      }
    ]
    : []
  ),
  ...(isDev
    ? [
      {
        label: 'Developer',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { role: 'seperator' },
          { role: 'toggledevtools' }
        ]
      }
    ]
    : []
  )
]

// Respond to ipcRenderer
ipcMain.on('image:resize', (e, options) => {
  options.dest = path.join(os.homedir(), 'imageresizer')
  resizeImage(options)
})

// Resize image function
async function resizeImage({ imgPath, width, height, dest }) {
  try {
    // Resize image
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height
    })

    // Get filename
    const filename = path.basename(imgPath)

    // Create destination folder if not exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }

    // Write the file to destination
    fs.writeFileSync(path.join(dest, filename), newPath)

    // Send success message
    mainWindow.webContents.send('image:done')

    // Open the destination folder
    shell.openPath(dest)
  } catch (err) {
    console.log(err)
  }
}

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})