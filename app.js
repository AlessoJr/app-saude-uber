const loginScreen = document.getElementById('login-screen');
const homeScreen = document.getElementById('home-screen');
const solicitarScreen = document.getElementById('solicitar-screen');
const minhasSolicitacoesScreen = document.getElementById('minhas-solicitacoes-screen');

const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const btnLogin = document.getElementById('btn-login');
const btnCadastrar = document.getElementById('btn-cadastrar');
const btnSair = document.getElementById('btn-sair');
const btnSolicitar = document.getElementById('btn-solicitar');
const btnMinhasSolicitacoes = document.getElementById('btn-minhas-solicitacoes');
const btnVoltar = document.getElementById('btn-voltar');
const btnVoltarHome = document.getElementById('btn-voltar-home');
const btnEnviarSolicitacao = document.getElementById('btn-enviar-solicitacao');
const enderecoInput = document.getElementById('endereco');
const datahoraInput = document.getElementById('datahora');
const especialidadeInput = document.getElementById('especialidade');
const nomeUsuarioSpan = document.getElementById('nome-usuario');
const listaSolicitacoesDiv = document.getElementById('lista-solicitacoes');
const listaMinhasSolicitacoesDiv = document.getElementById('lista-minhas-solicitacoes');

let usuarioAtual = null;

function mostrarTela(tela) {
  [loginScreen, homeScreen, solicitarScreen, minhasSolicitacoesScreen].forEach(el => el.style.display = 'none');
  tela.style.display = 'block';
}

auth.onAuthStateChanged(user => {
  if (user) {
    usuarioAtual = user;
    nomeUsuarioSpan.textContent = user.email;
    mostrarTela(homeScreen);
    carregarSolicitacoes();
  } else {
    usuarioAtual = null;
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
      return db.collection('users').doc(auth.currentUser.uid).set({
        email: auth.currentUser.email,
        tipo: 'acompanhante',
        nome: auth.currentUser.email
      });
    })
    .catch(err => alert('Erro: ' + err.message));
});

btnSair.addEventListener('click', () => auth.signOut());
btnSolicitar.addEventListener('click', () => mostrarTela(solicitarScreen));
btnVoltar.addEventListener('click', () => mostrarTela(homeScreen));

btnEnviarSolicitacao.addEventListener('click', async () => {
  if (!enderecoInput.value || !datahoraInput.value || !especialidadeInput.value) {
    alert('Preencha todos os campos');
    return;
  }
  try {
    await db.collection('solicitacoes').add({
      acompanhanteUID: usuarioAtual.uid,
      endereco: enderecoInput.value,
      dataHora: firebase.firestore.Timestamp.fromDate(new Date(datahoraInput.value)),
      especialidade: especialidadeInput.value,
      status: 'pendente',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      tecnicoUID: null
    });
    alert('Solicitação enviada!');
    enderecoInput.value = '';
    datahoraInput.value = '';
    especialidadeInput.value = '';
    mostrarTela(homeScreen);
    carregarSolicitacoes();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
});

function carregarSolicitacoes() {
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
        </div>`;
      });
      listaSolicitacoesDiv.innerHTML = html || '<p>Nenhuma solicitação.</p>';
    });
}

btnMinhasSolicitacoes.addEventListener('click', () => {
  mostrarTela(minhasSolicitacoesScreen);
  carregarMinhasSolicitacoes();
});
btnVoltarHome.addEventListener('click', () => mostrarTela(homeScreen));

function carregarMinhasSolicitacoes() {
  db.collection('solicitacoes')
    .where('acompanhanteUID', '==', usuarioAtual.uid)
    .orderBy('criadoEm', 'desc')
    .get()
    .then(snapshot => {
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const dataStr = data.dataHora ? data.dataHora.toDate().toLocaleString() : 'Sem data';
        html += `<div class="solicitacao">
          <strong>Status:</strong> ${data.status}<br>
          <strong>Endereço:</strong> ${data.endereco}<br>
          <strong>Data:</strong> ${dataStr}<br>
          <strong>Especialidade:</strong> ${data.especialidade}
        </div>`;
      });
      listaMinhasSolicitacoesDiv.innerHTML = html || '<p>Nenhuma solicitação.</p>';
    });
}
