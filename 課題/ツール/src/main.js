import { createClient } from '@supabase/supabase-js'

// 接続情報は .env から読み込む（コードに直書きしない）
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'images'

const drop = document.getElementById('drop')
const fileInput = document.getElementById('file-input')
const resultBox = document.getElementById('result')
const resultList = document.getElementById('result-list')
const gallery = document.getElementById('gallery')
const statusEl = document.getElementById('status')
const reloadBtn = document.getElementById('reload')
const loginForm = document.getElementById('login-form')
const showLoginBtn = document.getElementById('show-login')
const loggedInBox = document.getElementById('logged-in')
const userEmailEl = document.getElementById('user-email')
const logoutBtn = document.getElementById('logout')
const authError = document.getElementById('auth-error')
const uploadLocked = document.getElementById('upload-locked')

// 現在のログイン状態と、取得済みのファイル一覧
let session = null
let files = []

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  document.getElementById('config-error').hidden = false
  throw new Error('Supabase の接続情報が .env に設定されていません')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// アップロードできる画像の条件（Supabase 側のバケット設定 supabase-limits.sql と合わせること）
const MAX_BYTES = 5 * 1024 * 1024 // 5MB 以上は弾く
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// 条件に合わなければ理由を返す（合えば null）
function validate(file) {
  if (!ALLOWED_TYPES[file.type]) {
    return `対応していない形式です（JPEG・PNG・WEBP のみ）`
  }
  if (file.size >= MAX_BYTES) {
    return `サイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(1)}MB。5MB 未満にしてください）`
  }
  return null
}

// 日本語や空白を含むファイル名は Storage でエラーになることがあるため、ランダムな名前に置き換える
// 拡張子はファイル名ではなく実際の形式から付ける
function makePath(file) {
  return `${crypto.randomUUID()}.${ALLOWED_TYPES[file.type]}`
}

function publicUrlOf(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

async function copy(text, button) {
  await navigator.clipboard.writeText(text)
  const label = button.textContent
  button.textContent = 'コピーしました'
  setTimeout(() => (button.textContent = label), 1200)
}

// ---------- アップロード ----------
async function uploadFiles(selected) {
  if (selected.length === 0) return
  // アップロードはログイン中だけ（実際の可否は Supabase 側のポリシーで判定される）
  if (!session) {
    alert('画像をアップロードするにはログインしてください。')
    return
  }

  resultList.innerHTML = ''
  resultBox.hidden = false

  for (const file of selected) {
    const li = document.createElement('li')
    resultList.appendChild(li)

    // 形式・サイズのチェック（条件外はアップロードしない）
    const reason = validate(file)
    if (reason) {
      li.textContent = `${file.name}: ${reason}`
      li.className = 'error'
      continue
    }

    li.textContent = `${file.name} をアップロード中…`
    const path = makePath(file)
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type })

    if (error) {
      li.textContent = `${file.name}: 失敗しました（${error.message}）`
      li.className = 'error'
      continue
    }

    const url = publicUrlOf(path)
    li.innerHTML = ''
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener'
    link.textContent = url
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'URLをコピー'
    btn.addEventListener('click', () => copy(url, btn))
    li.append(`${file.name}: `, link, ' ', btn)

    // 成功したらすぐに一覧の先頭へ追加する（全件の再取得を待たない）
    files = [{ id: path, name: path }, ...files]
    renderGallery()
  }
}

// ---------- 一覧表示 ----------
async function loadList() {
  statusEl.textContent = '読み込み中…'
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) {
    statusEl.textContent = `一覧の取得に失敗しました（${error.message}）`
    return
  }

  // フォルダのプレースホルダー（.emptyFolderPlaceholder）などは除く
  files = data.filter((f) => f.id && !f.name.startsWith('.'))
  renderGallery()
}

function renderGallery() {
  statusEl.textContent = files.length ? `${files.length} 件（新しい順・最大100件）` : 'まだ画像がありません。'

  gallery.innerHTML = ''
  for (const f of files) {
    const url = publicUrlOf(f.name)
    const card = document.createElement('figure')
    card.className = 'card'

    const img = document.createElement('img')
    img.src = url
    img.alt = f.name
    img.loading = 'lazy'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'URLをコピー'
    btn.addEventListener('click', () => copy(url, btn))

    const actions = document.createElement('div')
    actions.className = 'card-actions'
    actions.append(btn)

    // ログイン中だけ削除ボタンを出す（実際の削除可否は Supabase 側のポリシーで判定される）
    if (session) {
      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'danger'
      del.textContent = '削除'
      del.addEventListener('click', () => deleteFile(f.name, del))
      actions.append(del)
    }

    card.append(img, actions)
    gallery.appendChild(card)
  }
}

// ---------- 削除 ----------
async function deleteFile(name, button) {
  if (!confirm('この画像を削除しますか？\n削除すると元に戻せず、この画像のURLも見られなくなります。')) return

  button.disabled = true
  const { data, error } = await supabase.storage.from(BUCKET).remove([name])

  // ポリシーで許可されていないと、エラーにならず「0件削除」が返るため件数も確認する
  if (error || !data || data.length === 0) {
    alert(`削除できませんでした（${error ? error.message : '権限がありません。削除用のSQLを実行したか確認してください'}）`)
    button.disabled = false
    return
  }
  loadList()
}

// ---------- ログイン ----------
function renderAuth() {
  const loggedIn = Boolean(session)
  loggedInBox.hidden = !loggedIn
  showLoginBtn.hidden = loggedIn || !loginForm.hidden
  if (loggedIn) loginForm.hidden = true
  userEmailEl.textContent = loggedIn ? session.user.email : ''
  // アップロード欄はログイン中だけ出す
  drop.hidden = !loggedIn
  uploadLocked.hidden = loggedIn
  if (!loggedIn) resultBox.hidden = true
}

showLoginBtn.addEventListener('click', () => {
  loginForm.hidden = false
  showLoginBtn.hidden = true
  document.getElementById('email').focus()
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  authError.hidden = true
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // よくある原因は日本語で、それ以外は Supabase のメッセージをそのまま出す
    const reasons = {
      invalid_credentials: 'メールアドレスかパスワードが違います（またはそのユーザーが存在しません）。',
      email_not_confirmed: 'メールアドレスが未確認です。管理画面でユーザーを確認済みにしてください。',
    }
    authError.textContent = `ログインできませんでした：${reasons[error.code] || `${error.message}（${error.code || error.status}）`}`
    authError.hidden = false
    return
  }
  document.getElementById('password').value = ''
})

logoutBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut()
  // サーバーに届かなかった場合も、この端末からはログアウトする
  if (error) await supabase.auth.signOut({ scope: 'local' })
})

// ログイン状態が変わったら画面を描き直す
// （このコールバック内で他の Supabase 処理を await すると固まることがあるため、描画だけ行う）
supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession
  renderAuth()
  renderGallery()
})

// ---------- ドラッグ＆ドロップ ----------
drop.addEventListener('dragover', (e) => {
  e.preventDefault()
  drop.classList.add('over')
})
drop.addEventListener('dragleave', () => drop.classList.remove('over'))
drop.addEventListener('drop', (e) => {
  e.preventDefault()
  drop.classList.remove('over')
  uploadFiles(e.dataTransfer.files)
})
fileInput.addEventListener('change', () => {
  uploadFiles(fileInput.files)
  fileInput.value = ''
})
reloadBtn.addEventListener('click', loadList)

loadList()
