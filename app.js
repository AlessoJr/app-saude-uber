// ==================== REFERÊNCIAS ====================
const loginScreen = document.getElementById('login-screen');
const cadastroScreen = document.getElementById('cadastro-screen');
const homeScreen = document.getElementById('home-screen');
const solicitarScreen = document.getElementById('solicitar-screen');
const listaScreen = document.getElementById('lista-screen');
const chatScreen = document.getElementById('chat-screen');
const avaliacaoScreen = document.getElementById('avaliacao-screen');
const perfilScreen = document.getElementById('perfil-screen');

const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const btnLogin = document.getElementById('btn-login');
const btnCadastrar = document.getElementById('btn-cadastrar');
const btnSair = document.getElementById('btn-sair');
const btnSolicitar = document.getElementById('btn-solicitar');
const btnVerSolicitacoes = document.getElementById('btn-ver-solicitacoes');
const btnPerfil = document.getElementById('btn-perfil');
const btnVoltar = document.getElementById('btn-voltar');
const btnVoltarLista = document.getElementById('btn-voltar-lista');
const btnEnviarSolicitacao = document.getElementById('btn-enviar-solicitacao');
const btnFinalizarCadastro = document.getElementById('btn-finalizar-cadastro');
const enderecoInput = document.getElementById('endereco');
const datahoraInput = document.getElementById('datahora');
const especialidadeInput = document.getElementById('especialidade');
const nomeUsuarioSpan = document.getElementById('nome-usuario');
const tipoUsuarioSpan = document.getElementById('tipo-usuario');
const listaSolicitacoesDiv = document.getElementById('lista-solicitacoes');
const listaCompletaDiv = document.getElementById('lista-completa');
const mensagensChatDiv = document.getElementById('mensagens-chat');
const msgInput = document.getElementById('msg-input');
const btnEnviarMsg = document.getElementById('btn-enviar-msg');
const btnFecharChat = document.getElementById('btn-fechar-chat');
const estrelas = document.querySelectorAll('#estrelas span');
const comentarioAvaliacao = document.getElementById('comentario-avaliacao');
const btnEnviarAvaliacao = document.getElementById('btn-enviar-avaliacao');
const btnFecharAvaliacao = document.getElementById('btn-fechar-avaliacao');
const perfilNome = document.getElementById('perfil-nome');
const perfilTipo = document.getElementById('perfil-tipo');
const perfilEmail = document.getElementById('perfil-email');
const editarNome = document.getElementById('editar-nome');
const btnSalvarNome = document.getElementById('btn-salvar-nome');
const btnFecharPerfil = document.getElementById('btn-fechar-perfil');
const nomeCadastro = document.getElementById('nome-cadastro');
const tipoCadastro = document.getElementById('tipo-cadastro');
const especialidadeCadastro = document.getElementById('especialidade-cadastro');

let usuarioAtual = null;
let dadosUsuario = null;
let solicitacaoAtiva = null; // para chat/avaliacao

// ==================== FUNÇÕES DE TELA ====================
function mostrarTela(tela) {
  [loginScreen, cadastroScreen, homeScreen, solicitarScreen, listaScreen, chatScreen, avaliacaoScreen, perfilScreen].forEach(el => el.style.display = 'none');
  tela.style.display = 'block';
}

// ==================== AUTENTICAÇÃO ====================
auth.onAuthStateChanged(async user => {
  if (user) {
    usuarioAtual = user;
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) {
      mostrarTela(cadastroScreen);
      return;
    }
    dadosUsuario = doc.data();
    nomeUsuarioSpan.textContent = dadosUsuario.nome || user.email;
    tipoUsuarioSpan.textContent = 'Tipo: ' + (dadosUsuario.tipo || 'acompanhante');
    mostrarTela(homeScreen);
    carregarSolicitacoesHome();
  } else {
    usuarioAtual = null;
    dadosUsuario = null;
    mostrarTela(loginScreen);
  }
});

btnLogin.addEventListener('click', () => {
  auth.signInWithEmailAndPassword(emailInput.value, senhaInput.value)
    .catch(err => alert('Erro: ' + err.message));
});

btnCadastrar.addEventListener('click', () => {
  auth.createUserWithEmailAndPassword(emailInput.value, senhaInput.value)
    .then(() => {
      // vai para tela de cadastro para completar perfil
    })
    .catch(err => alert('Erro: ' + err.message));
});

btnFinalizarCadastro.addEventListener('click', async () => {
  const nome = nomeCadastro.value;
  const tipo = tipoCadastro.value;
  let especialidade = especialidadeCadastro.value;
  if (!nome) { alert('Digite seu nome'); return; }
  if (tipo === 'tecnico' && !especialidade) { alert('Digite sua especialidade'); return; }
  try {
    await db.collection('users').doc(auth.currentUser.uid).set({
      nome: nome,
      email: auth.currentUser.email,
      tipo: tipo,
      especialidade: especialidade || '',
      disponivel: true,
      avaliacaoMedia: 0,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Cadastro completo!');
    // recarrega
    window.location.reload();
  } catch (e) { alert('Erro: ' + e.message); }
});

// mostrar campo especialidade só se técnico
tipoCadastro.addEventListener('change', () => {
  especialidadeCadastro.style.display = tipoCadastro.value === 'tecnico' ? 'block' : 'none';
});

btnSair.addEventListener('click', () => auth.signOut());

// ==================== SOLICITAR SERVIÇO ====================
btnSolicitar.addEventListener('click', () => {
  if (dadosUsuario.tipo !== 'acompanhante') {
    alert('Apenas acompanhantes podem solicitar.');
    return;
  }
  mostrarTela(solicitarScreen);
  // pegar localização
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      // armazena para uso no envio
      window.lat = pos.coords.latitude;
      window.lng = pos.coords.longitude;
    }, () => {});
  }
});

btnVoltar.addEventListener('click', () => mostrarTela(homeScreen));

btnEnviarSolicitacao.addEventListener('click', async () => {
  if (!enderecoInput.value || !datahoraInput.value || !especialidadeInput.value) {
    alert('Preencha todos os campos');
    return;
  }
  try {
    const geo = firebase.firestore.GeoPoint(window.lat || 0, window.lng || 0);
    await db.collection('solicitacoes').add({
      acompanhanteUID: usuarioAtual.uid,
      acompanhanteNome: dadosUsuario.nome,
      endereco: enderecoInput.value,
      dataHora: firebase.firestore.Timestamp.fromDate(new Date(datahoraInput.value)),
      especialidade: especialidadeInput.value,
      status: 'pendente',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      tecnicoUID: null,
      localizacao: geo
    });
    alert('Solicitação enviada!');
    enderecoInput.value = '';
    datahoraInput.value = '';
    especialidadeInput.value = '';
    mostrarTela(homeScreen);
    carregarSolicitacoesHome();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
});

// ==================== HOME: LISTA DE SOLICITAÇÕES (acompanhante) ====================
function carregarSolicitacoesHome() {
  if (dadosUsuario.tipo === 'acompanhante') {
    db.collection('solicitacoes')
      .where('acompanhanteUID', '==', usuarioAtual.uid)
      .orderBy('criadoEm', 'desc')
      .onSnapshot(snapshot => {
        let html = '';
        snapshot.forEach(doc => {
          const data = doc.data();
          const dataStr = data.dataHora ? data.dataHora.toDate().toLocaleString() : 'Sem data';
          html += `<div class="solicitacao">
            <strong>Status:</strong> ${data.status}<br>
            <strong>Endereço:</strong> ${data.endereco}<br>
            <strong>Data:</strong> ${dataStr}<br>
            <strong>Especialidade:</strong> ${data.especialidade}
            ${data.status === 'aceita' ? `<button data-id="${doc.id}" class="btn-chat">Chat</button>` : ''}
            ${data.status === 'finalizada' && !data.avaliado ? `<button data-id="${doc.id}" class="btn-avaliar">Avaliar</button>` : ''}
          </div>`;
        });
        listaSolicitacoesDiv.innerHTML = html || '<p>Nenhuma solicitação.</p>';
        // eventos para chat e avaliar
        document.querySelectorAll('.btn-chat').forEach(b => b.onclick = () => abrirChat(b.dataset.id));
        document.querySelectorAll('.btn-avaliar').forEach(b => b.onclick = () => abrirAvaliacao(b.dataset.id));
      });
  } else {
    // técnico: vê as pendentes
    db.collection('solicitacoes')
      .where('status', 'in', ['pendente', 'aceita'])
      .orderBy('criadoEm', 'desc')
      .onSnapshot(snapshot => {
        let html = '';
        snapshot.forEach(doc => {
          const data = doc.data();
          const dataStr = data.dataHora ? data.dataHora.toDate().toLocaleString() : 'Sem data';
          html += `<div class="solicitacao">
            <strong>Status:</strong> ${data.status}<br>
            <strong>Acompanhante:</strong> ${data.acompanhanteNome}<br>
            <strong>Endereço:</strong> ${data.endereco}<br>
            <strong>Data:</strong> ${dataStr}<br>
            <strong>Especialidade:</strong> ${data.especialidade}
            ${data.status === 'pendente' ? `<button data-id="${doc.id}" class="btn-aceitar">Aceitar</button>` : ''}
            ${data.status === 'aceita' && data.tecnicoUID === usuarioAtual.uid ? `<button data-id="${doc.id}" class="btn-finalizar">Finalizar</button>` : ''}
            ${data.status === 'aceita' ? `<button data-id="${doc.id}" class="btn-chat">Chat</button>` : ''}
          </div>`;
        });
        listaSolicitacoesDiv.innerHTML = html || '<p>Nenhuma solicitação pendente.</p>';
        document.querySelectorAll('.btn-aceitar').forEach(b => b.onclick = () => aceitarSolicitacao(b.dataset.id));
        document.querySelectorAll('.btn-finalizar').forEach(b => b.onclick = () => finalizarSolicitacao(b.dataset.id));
        document.querySelectorAll('.btn-chat').forEach(b => b.onclick = () => abrirChat(b.dataset.id));
      });
  }
}

// ==================== ACEITAR SOLICITAÇÃO ====================
async function aceitarSolicitacao(id) {
  try {
    await db.collection('solicitacoes').doc(id).update({
      status: 'aceita',
      tecnicoUID: usuarioAtual.uid,
      tecnicoNome: dadosUsuario.nome
    });
    alert('Solicitação aceita!');
  } catch (e) { alert('Erro: ' + e.message); }
}

// ==================== FINALIZAR SOLICITAÇÃO ====================
async function finalizarSolicitacao(id) {
  if (confirm('Finalizar esta solicitação?')) {
    try {
      await db.collection('solicitacoes').doc(id).update({
        status: 'finalizada'
      });
      alert('Solicitação finalizada!');
    } catch (e) { alert('Erro: ' + e.message); }
  }
}

// ==================== VER TODAS SOLICITAÇÕES (com filtros) ====================
btnVerSolicitacoes.addEventListener('click', () => {
  mostrarTela(listaScreen);
  carregarListaCompleta('todos');
});

document.querySelectorAll('.filtro').forEach(el => {
  el.addEventListener('click', () => carregarListaCompleta(el.dataset.status));
});

btnVoltarLista.addEventListener('click', () => mostrarTela(homeScreen));

function carregarListaCompleta(filtro) {
  let query = db.collection('solicitacoes').orderBy('criadoEm', 'desc');
  if (filtro !== 'todos') {
    query = query.where('status', '==', filtro);
  }
  query.get().then(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      // só mostra se for acompanhante ou técnico envolvido
      if (data.acompanhanteUID !== usuarioAtual.uid && data.tecnicoUID !== usuarioAtual.uid) return;
      const dataStr = data.dataHora ? data.dataHora.toDate().toLocaleString() : 'Sem data';
      html += `<div class="solicitacao">
        <strong>Status:</strong> ${data.status}<br>
        <strong>Endereço:</strong> ${data.endereco}<br>
        <strong>Data:</strong> ${dataStr}<br>
        <strong>Especialidade:</strong> ${data.especialidade}
        ${data.status === 'aceita' ? `<button data-id="${doc.id}" class="btn-chat-lista">Chat</button>` : ''}
        ${data.status === 'finalizada' && !data.avaliado ? `<button data-id="${doc.id}" class="btn-avaliar-lista">Avaliar</button>` : ''}
      </div>`;
    });
    listaCompletaDiv.innerHTML = html || '<p>Nenhuma solicitação.</p>';
    document.querySelectorAll('.btn-chat-lista').forEach(b => b.onclick = () => abrirChat(b.dataset.id));
    document.querySelectorAll('.btn-avaliar-lista').forEach(b => b.onclick = () => abrirAvaliacao(b.dataset.id));
  });
}

// ==================== CHAT ====================
let chatUnsubscribe = null;

async function abrirChat(solicitacaoId) {
  solicitacaoAtiva = solicitacaoId;
  mostrarTela(chatScreen);
  mensagensChatDiv.innerHTML = '';
  // carregar mensagens
  if (chatUnsubscribe) chatUnsubscribe();
  chatUnsubscribe = db.collection('mensagens')
    .where('solicitacaoId', '==', solicitacaoId)
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
      let html = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        const remetente = msg.remetenteUID === usuarioAtual.uid ? 'Você' : msg.remetenteNome;
        html += `<div><strong>${remetente}:</strong> ${msg.texto}</div>`;
      });
      mensagensChatDiv.innerHTML = html;
      mensagensChatDiv.scrollTop = mensagensChatDiv.scrollHeight;
    });
}

btnEnviarMsg.addEventListener('click', async () => {
  const texto = msgInput.value.trim();
  if (!texto) return;
  try {
    await db.collection('mensagens').add({
      solicitacaoId: solicitacaoAtiva,
      remetenteUID: usuarioAtual.uid,
      remetenteNome: dadosUsuario.nome,
      texto: texto,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    msgInput.value = '';
  } catch (e) { alert('Erro: ' + e.message); }
});

btnFecharChat.addEventListener('click', () => {
  if (chatUnsubscribe) chatUnsubscribe();
  mostrarTela(homeScreen);
});

// ==================== AVALIAÇÃO ====================
let notaSelecionada = 0;

estrelas.forEach(el => {
  el.addEventListener('click', () => {
    notaSelecionada = parseInt(el.dataset.nota);
    estrelas.forEach(s => s.style.color = parseInt(s.dataset.nota) <= notaSelecionada ? 'gold' : 'gray');
  });
});

async function abrirAvaliacao(solicitacaoId) {
  solicitacaoAtiva = solicitacaoId;
  notaSelecionada = 0;
  estrelas.forEach(s => s.style.color = 'gray');
  comentarioAvaliacao.value = '';
  mostrarTela(avaliacaoScreen);
}

btnEnviarAvaliacao.addEventListener('click', async () => {
  if (!notaSelecionada) { alert('Selecione uma nota'); return; }
  try {
    await db.collection('avaliacoes').add({
      solicitacaoId: solicitacaoAtiva,
      avaliadorUID: usuarioAtual.uid,
      nota: notaSelecionada,
      comentario: comentarioAvaliacao.value,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    // marcar solicitação como avaliada
    await db.collection('solicitacoes').doc(solicitacaoAtiva).update({ avaliado: true });
    alert('Avaliação enviada!');
    mostrarTela(homeScreen);
  } catch (e) { alert('Erro: ' + e.message); }
});

btnFecharAvaliacao.addEventListener('click', () => mostrarTela(homeScreen));

// ==================== PERFIL ====================
btnPerfil.addEventListener('click', () => {
  perfilNome.textContent = dadosUsuario.nome || '—';
  perfilTipo.textContent = dadosUsuario.tipo || '—';
  perfilEmail.textContent = usuarioAtual.email;
  editarNome.value = '';
  mostrarTela(perfilScreen);
});

btnSalvarNome.addEventListener('click', async () => {
  const novoNome = editarNome.value.trim();
  if (!novoNome) { alert('Digite um nome'); return; }
  try {
    await db.collection('users').doc(usuarioAtual.uid).update({ nome: novoNome });
    dadosUsuario.nome = novoNome;
    nomeUsuarioSpan.textContent = novoNome;
    alert('Nome atualizado!');
    mostrarTela(homeScreen);
  } catch (e) { alert('Erro: ' + e.message); }
});

btnFecharPerfil.addEventListener('click', () => mostrarTela(homeScreen));

// ==================== GEOLOCALIZAÇÃO ====================
// já capturamos no envio da solicitação

// ==================== NOTIFICAÇÕES (FCM) ====================
// Para habilitar, siga: https://firebase.google.com/docs/cloud-messaging/js/client
// Você precisa adicionar o service worker e o token no Firestore.

// ==================== MAPA ====================
// Para abrir o endereço no Google Maps, adicione um link ou use Leaflet.
// Exemplo: window.open(`https://www.google.com/maps?q=${lat},${lng}`);

