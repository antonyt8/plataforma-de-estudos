import re
import json
from pathlib import Path
from pdf2image import convert_from_path
import pytesseract

# ---------------------------------------------------------
# Configuração de Diretórios
# ---------------------------------------------------------
DIRETORIO_BASE = Path('/home/antonyt8/estudos-concurso/plataforma-mapa/extrair-questões')
DIRETORIO_PDFS = DIRETORIO_BASE / 'pdfs-extração'
DIRETORIO_SAIDA = DIRETORIO_BASE / 'questoes-extraidas'

DIRETORIO_SAIDA.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# Lógica de OCR e Extração
# ---------------------------------------------------------
def extrair_texto_via_ocr(caminho_arquivo):
    print(f"     [OCR] Convertendo páginas para imagens...")
    # Converte o PDF em uma lista de imagens
    imagens = convert_from_path(caminho_arquivo)
    
    texto_completo = ""
    print(f"     [OCR] Lendo texto de {len(imagens)} página(s)...")
    
    for imagem in imagens:
        # Pede ao Tesseract para ler a imagem em português
        texto_pagina = pytesseract.image_to_string(imagem, lang='por')
        texto_completo += texto_pagina + "\n"
        
    return texto_completo

def estruturar_questoes(texto_completo):
    # Tenta quebrar o texto no gabarito
    partes = re.split(r'\n\s*G\s*A\s*B\s*A\s*R\s*I\s*T\s*O|\n\s*GABARITO', texto_completo, flags=re.IGNORECASE)
    txt_questoes = partes[0]
    txt_gabarito = partes[1] if len(partes) > 1 else ""

    questoes_lista = []

    # Regex que captura 1., 01), 1 -, a), etc.
    padrao_quebra = r"(?m)^\s*(?:Questão\s+)?(\d{1,3}|[a-zA-Z]{1,2})[\.\)\-]\s+"
    blocos_questoes = re.split(padrao_quebra, txt_questoes)

    for i in range(1, len(blocos_questoes) - 1, 2):
        id_questao = blocos_questoes[i].strip()
        enunciado = blocos_questoes[i+1].strip()
        enunciado = re.sub(r'\s+', ' ', enunciado) 
        
        if enunciado:
            questoes_lista.append({
                "id": id_questao,
                "enunciado": enunciado,
                "resposta_gabarito": "Gabarito não encontrado"
            })

    # Fatiar o gabarito e mesclar as respostas
    if txt_gabarito:
        blocos_gab = re.split(padrao_quebra, txt_gabarito)
        for i in range(1, len(blocos_gab) - 1, 2):
            id_gab = blocos_gab[i].strip()
            resp_gab = blocos_gab[i+1].strip()
            resp_gab = re.sub(r'\s+', ' ', resp_gab)
            
            for q in questoes_lista:
                if str(q["id"]).lower() == str(id_gab).lower():
                    q["resposta_gabarito"] = resp_gab
                    break

    return questoes_lista

# ---------------------------------------------------------
# Execução Principal
# ---------------------------------------------------------
if __name__ == "__main__":
    if not DIRETORIO_PDFS.exists():
        print(f"Erro: A pasta {DIRETORIO_PDFS} não foi encontrada.")
        exit(1)

    arquivos_pdf = list(DIRETORIO_PDFS.glob('*.pdf'))
    
    if not arquivos_pdf:
        print("Nenhum PDF encontrado na pasta de extração.")
        exit(0)
    
    for caminho_pdf in arquivos_pdf:
        print(f"\nProcessando: {caminho_pdf.name}...")
        
        # 1. Extrai todo o texto da imagem usando IA (Tesseract)
        texto_bruto = extrair_texto_via_ocr(caminho_pdf)
        
        # 2. Estrutura o texto lido no nosso formato JSON
        questoes_extraidas = estruturar_questoes(texto_bruto)
        
        if questoes_extraidas:
            dados_json = {
                "arquivo_origem": caminho_pdf.name,
                "total_questoes": len(questoes_extraidas),
                "questoes": questoes_extraidas
            }
            
            nome_arquivo_saida = caminho_pdf.stem + '.json'
            caminho_saida = DIRETORIO_SAIDA / nome_arquivo_saida
            
            with open(caminho_saida, 'w', encoding='utf-8') as f_saida:
                json.dump(dados_json, f_saida, ensure_ascii=False, indent=4)
                
            print(f"  -> Sucesso! {len(questoes_extraidas)} questões salvas em {caminho_saida.name}")
        else:
            print(f"  -> Falha. Nenhuma questão pôde ser estruturada a partir da transcrição.")

    print("\nExtração finalizada com transcrição óptica!")