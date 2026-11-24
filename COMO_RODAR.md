# Como rodar o código (compilador, IDE e dicas)

## Primeiro: Python não precisa de compilador

Python é uma linguagem **interpretada**: não existe etapa de "compilar". Você só precisa de dois
programas instalados, e depois executa os arquivos `.py` diretamente:

1. o **interpretador Python** (versão 3.10 ou mais nova; o projeto foi testado no 3.14);
2. um **editor ou IDE** (opcional, mas facilita): VS Code, PyCharm, Jupyter ou o próprio terminal.

Conferir se já está instalado:

```bash
python --version
```

No Windows, se aparecer "python não é reconhecido", tente `py -3 --version`. Se também não
funcionar, instale pelo site <https://www.python.org/downloads/> e **marque a caixa
"Add Python to PATH"** no instalador.

## Ordem de execução do projeto

```bash
pip install -r requirements.txt     # só na primeira vez
python 01_gerar_dados.py            # 1) gera e prepara os dados (opcional: python 01_gerar_dados.py 5000 --semente 7)
python 02_nao_supervisionado.py     # 2) K-Means e PCA (gráficos em graficos/)
python 03_supervisionado.py         # 3) Regressão Logística e Random Forest
python main.py                      # 4) menu interativo
```

Cada etapa depende da anterior (usa os arquivos que ela gerou em `dados/` e `modelos/`).
O `main.py` também oferece rodar tudo sozinho se os modelos ainda não existirem (opção 5 do menu).

---

## Opção 1 · Visual Studio Code (recomendado)

1. Instale o Python e o **VS Code** (<https://code.visualstudio.com>).
2. No VS Code, abra **Extensions** (Ctrl+Shift+X), instale **Python** (Microsoft).
3. **File → Open Folder** e escolha a pasta `gta6-ml`.
4. Abra o terminal integrado: **Ctrl + `** (crase).
5. Crie o ambiente virtual e instale as dependências:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate          # Windows (cmd ou PowerShell)
   source .venv/bin/activate       # Linux ou Mac
   pip install -r requirements.txt
   ```

6. **Ctrl+Shift+P → "Python: Select Interpreter"** e escolha o que termina em `.venv`.
7. Abra um arquivo `.py` e clique no botão **▶ Run Python File** (canto superior direito).
   Para o `main.py`, rode no terminal (`python main.py`), porque ele pede digitação.
8. **F5** inicia a depuração: clique ao lado do número da linha para criar um *breakpoint* e
   inspecione as variáveis. Ótimo para estudar o código para a arguição.

## Opção 2 · PyCharm

1. **File → Open** e escolha a pasta do projeto.
2. **Settings → Project → Python Interpreter → Add Interpreter → Virtualenv Environment**.
   O PyCharm avisa que existe um `requirements.txt` e oferece instalar: aceite.
3. Clique com o botão direito no arquivo → **Run 'nome'** (rode 01, 02 e 03 nessa ordem).
4. O `main.py` aceita digitação na própria janela **Run**.
5. Se os acentos saírem estranhos: em **Run → Edit Configurations → Environment variables**
   adicione `PYTHONIOENCODING=utf-8`.

## Opção 3 · Só o terminal

```bash
cd caminho/da/pasta/gta6-ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

- **PowerShell bloqueou o `activate`?** Rode `Set-ExecutionPolicy -Scope Process Bypass` e tente
  de novo (vale só para aquela janela).
- Sem ambiente virtual também funciona: `pip install -r requirements.txt` instala direto no
  Python do computador.

## Opção 4 · Google Colab (sem instalar nada)

1. Entre em <https://colab.research.google.com> e crie um **novo notebook**.
2. Na barra lateral, clique no **ícone de pasta** e arraste os 4 arquivos `.py` e o
   `requirements.txt` para lá (o `main.py` é opcional).
3. Em cada célula, rode um dos blocos abaixo (**Shift+Enter**):

   ```python
   !pip install -q -r requirements.txt
   ```

   ```python
   %run 01_gerar_dados.py
   %run 02_nao_supervisionado.py
   %run 03_supervisionado.py
   ```

   ```python
   %run main.py        # %run aceita digitação; "!python main.py" não
   ```

   ```python
   from IPython.display import Image
   Image('graficos/02_clusters_pca.png')
   ```

O Colab já traz pandas, scikit-learn e matplotlib: o `pip install` quase não baixa nada.
Os arquivos do Colab somem quando a sessão acaba; baixe os gráficos antes de sair.

## Opção 5 · Jupyter Notebook (local)

```bash
pip install notebook
jupyter notebook
```

Crie um notebook na pasta do projeto e use `%run main.py`, igual ao Colab.

---

## Erros comuns e soluções

| Erro | Causa e solução |
|---|---|
| `python não é reconhecido` | Python fora do PATH. Reinstale marcando **Add to PATH**, ou use `py -3`. |
| `ModuleNotFoundError: No module named 'sklearn'` | Faltou instalar ou o ambiente errado está ativo. Rode `pip install -r requirements.txt` com o `.venv` ativado (o prompt mostra `(.venv)`). |
| `pip` não encontrado | Use `python -m pip install -r requirements.txt`. |
| `Arquivos da etapa 1 não encontrados` | Rode `01_gerar_dados.py` antes do 02 e do 03. |
| `UnicodeEncodeError` ao imprimir acentos | Terminal antigo do Windows. Use `chcp 65001` ou `set PYTHONIOENCODING=utf-8`. Os scripts já tentam configurar UTF-8 sozinhos. |
| Os gráficos não abrem em janela | É de propósito: os scripts **salvam** as imagens na pasta `graficos/`. Abra os `.png` por lá. |
| Falha ao instalar scikit-learn em Python muito novo | Use Python 3.11 ou 3.12, que têm pacotes prontos para todas as bibliotecas. |

## Antes de apresentar

- Rode as etapas 01 a 03 **no computador da apresentação** e confira o `main.py` uma vez.
- Abra `apresentacao/index.html` no **Chrome** (funciona sem internet; só as fontes bonitas vêm
  da web e há alternativa automática). Aperte **F** para tela cheia e **N** para suas notas.
- Deixe uma janela do terminal já aberta na pasta do projeto, caso o professor peça para rodar
  `python main.py` ao vivo.
- Tenha uma cópia do projeto em um pen drive ou nuvem, e um PDF dos slides (Ctrl+P no navegador
  gera PDF da apresentação).
