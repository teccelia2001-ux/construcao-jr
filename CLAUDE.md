# Regras do projeto CONSTRUTORA JR

## Versão nova

A cada mudança publicada no app:

1. Aumente o número da versão, sempre igual, em três lugares:
   - `APP_VERSION` no `app.js`;
   - `version.json`;
   - os `?v=` do `index.html`.
2. Atualize a nota do Obsidian em `obsidian/CONSTRUTORA JR.md`, no mesmo commit:
   - `versao` e `atualizado` no topo da nota;
   - a linha "Versão atual" no quadro Acesso;
   - as seções que mudaram (abas, regras, login…);
   - uma linha nova no "Histórico de versões".

O computador do usuário baixa essa nota do GitHub sozinho, a cada 30 minutos, para a pasta `030 PROJETOS/CONSTRUTORA JR` do Obsidian. Por isso a nota precisa estar sempre completa e atualizada no repositório.

Escreva a nota em português simples. Use `- [x]` nos itens prontos e `- [ ]` nas pendências.
