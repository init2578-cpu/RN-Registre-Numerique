const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let backendProcess;

function killPort5000() {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            exec('netstat -ano | findstr LISTENING | findstr :5000', (err, stdout) => {
                if (stdout) {
                    const lines = stdout.trim().split('\n');
                    // Find the PID and kill it
                    let killed = false;
                    for (const line of lines) {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[parts.length - 1];
                        if (pid && pid !== '0') {
                            exec(`taskkill /F /PID ${pid}`, () => { });
                            killed = true;
                        }
                    }
                    setTimeout(resolve, 1000); // laisser le temps de tuer
                } else {
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false, // Ne pas montrer immédiatement (attendre que ce soit prêt)
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Optionnel si on a besoin d'IPC complexes plus tard
        },
        icon: path.join(__dirname, 'build', 'icon.ico') // L'icône (ajoutez-en une dans ce dossier plus tard)
    });

    // Enlever le menu par défaut d'Electron
    mainWindow.setMenuBarVisibility(false);

    // Charger l'URL du frontend Vite (en mode développement) ou le fichier statique (en production)
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // Ouvrir les outils de développement en mode dev
        // mainWindow.webContents.openDevTools();
    } else {
        // En production, on charge le build de l'interface React
        mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Démarrer le backend (serveur Node + SQLite)
function startBackend() {
    return new Promise(async (resolve, reject) => {
        await killPort5000();
        const backendPath = path.join(__dirname, 'backend', 'server.js');

        // On lance node sur notre fichier server.js sans shell: true
        backendProcess = spawn(process.execPath, [backendPath], {
            cwd: app.getPath('userData'), // Utiliser un vrai dossier inscriptible pour le cwd, l'asar fait crasher spawn
            // Utiliser des variables d'environnement spécifiques pour dire qu'on roule le backend via le binaire electron
            env: {
                ...process.env,
                ELECTRON_RUN_AS_NODE: '1',
                APP_DATA_PATH: app.getPath('userData') // Transmettre le chemin inscriptible au serveur
            }
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(`Backend stdout: ${data}`);
            // Dès qu'on voit que le serveur a démarré, on peut lancer l'interface
            if (data.toString().includes('Serveur backend démarré') || data.toString().includes('5000')) {
                resolve();
            }
        });

        backendProcess.stderr.on('data', (data) => {
            console.error(`Backend stderr: ${data}`);
        });

        backendProcess.on('close', (code) => {
            console.log(`Backend process exited with code ${code}`);
        });

        // Timeout de sécurité au cas où l'app se lance plus vite
        setTimeout(resolve, 2000);
    });
}

app.whenReady().then(async () => {
    try {
        await startBackend();
        createWindow();
    } catch (err) {
        console.error("Erreur lors du démarrage du backend :", err);
        // On essaie quand même d'ouvrir la fenêtre
        createWindow();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Chercher les mises à jour
    autoUpdater.checkForUpdatesAndNotify();
});

// Événements autoUpdater
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Mise à jour disponible',
        message: 'Une nouvelle version de Registre Numérique est disponible. Le téléchargement a commencé en arrière-plan.',
        buttons: ['Ok']
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Mise à jour prête',
        message: 'La nouvelle version a été téléchargée et sera installée à la fermeture de l\'application. Voulez-vous redémarrer maintenant pour l\'installer ?',
        buttons: ['Redémarrer', 'Plus tard']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Tuer le backend quand Electron se ferme pour éviter les processus orphelins (ports bloqués)
app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
