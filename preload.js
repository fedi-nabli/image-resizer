const os = require('os')
const path = require('path')
const { contextBridge } = require('electron')
const Toastify = require('toastify-js')

contextBridge.exposeInMainWorld('os', {
  homedir: () => os.homedir()
})

contextBridge.exposeInMainWorld('path', {
  join: (...args) => path.join(...args)
})

contextBridge.exposeInMainWorld('Toastify', {
  toast: (options) => Toastify(options).showToast()
})