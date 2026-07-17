// Armazenamento local (§7.2): tudo é salvo no aparelho na hora,
// com ou sem internet. IndexedDB puro, sem dependências.
const DB_NOME = 'diario-do-trabalhador'
const STORE = 'registros'

function abrir() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' })
        os.createIndex('status', 'status')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(modo, fn) {
  const db = await abrir()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, modo)
    const res = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(res.result !== undefined ? res.result : res)
    t.onerror = () => reject(t.error)
  })
}

export async function salvarLocal(registro) {
  return tx('readwrite', (os) => os.put(registro))
}

// userId: um aparelho pode ser usado por mais de um trabalhador —
// cada um só vê (e sincroniza) os próprios registros.
export async function listarLocal(userId) {
  const db = await abrir()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    req.onsuccess = () => {
      const todos = req.result || []
      resolve(userId ? todos.filter((r) => r.user_id === userId) : todos)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function pendentes(userId) {
  const todos = await listarLocal(userId)
  return todos.filter((r) => r.status === 'pendente')
}
