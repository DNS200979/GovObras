/**
 * Tipos gerados a partir do schema Supabase (projeto sidkrwbzbfkbjyqnurgp).
 *
 * NÃO EDITE À MÃO. Para regenerar:
 *
 *   URL=$(grep '^POSTGRES_URL_NON_POOLING' apps/gov/.env.local | cut -d= -f2- | tr -d '"')
 *   npx supabase gen types typescript --db-url "$URL" --schema public \
 *     > packages/database/src/types.ts
 *
 * Requer Docker rodando (o CLI sobe a imagem postgres-meta para introspectar).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      acoes_remocao: {
        Row: {
          adicionalidade: string
          condicionantes: Json | null
          created_at: string
          id: string
          lancamento_id: string
          linha_base: string
          parcela_liberada_pct: number
          tco2e_reconhecido: number
          tipo: string
        }
        Insert: {
          adicionalidade: string
          condicionantes?: Json | null
          created_at?: string
          id?: string
          lancamento_id: string
          linha_base: string
          parcela_liberada_pct?: number
          tco2e_reconhecido: number
          tipo: string
        }
        Update: {
          adicionalidade?: string
          condicionantes?: Json | null
          created_at?: string
          id?: string
          lancamento_id?: string
          linha_base?: string
          parcela_liberada_pct?: number
          tco2e_reconhecido?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_remocao_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      alternativas_material: {
        Row: {
          ativo: boolean
          created_at: string
          custo_adicional_por_unidade: number
          id: string
          material: string
          material_original: string
          tco2e_evitado_por_unidade: number
          unidade: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_adicional_por_unidade: number
          id?: string
          material: string
          material_original: string
          tco2e_evitado_por_unidade: number
          unidade: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_adicional_por_unidade?: number
          id?: string
          material?: string
          material_original?: string
          tco2e_evitado_por_unidade?: number
          unidade?: string
        }
        Relationships: []
      }
      autos: {
        Row: {
          assinado_em: string | null
          assinado_por: string | null
          created_at: string
          enquadramento_legal: string | null
          fiscalizacao_id: string
          id: string
          prazo_defesa: string | null
          sancao: Json | null
          tac_vinculado_id: string | null
          tipo: string
          tramitacao: string
        }
        Insert: {
          assinado_em?: string | null
          assinado_por?: string | null
          created_at?: string
          enquadramento_legal?: string | null
          fiscalizacao_id: string
          id?: string
          prazo_defesa?: string | null
          sancao?: Json | null
          tac_vinculado_id?: string | null
          tipo: string
          tramitacao?: string
        }
        Update: {
          assinado_em?: string | null
          assinado_por?: string | null
          created_at?: string
          enquadramento_legal?: string | null
          fiscalizacao_id?: string
          id?: string
          prazo_defesa?: string | null
          sancao?: Json | null
          tac_vinculado_id?: string | null
          tipo?: string
          tramitacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "autos_assinado_por_fkey"
            columns: ["assinado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autos_fiscalizacao_id_fkey"
            columns: ["fiscalizacao_id"]
            isOneToOne: false
            referencedRelation: "fiscalizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      concreteira_esg: {
        Row: {
          categoria: string
          concreteira_id: string
          created_at: string
          criado_por: string
          descricao: string
          id: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          concreteira_id: string
          created_at?: string
          criado_por: string
          descricao: string
          id?: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          concreteira_id?: string
          created_at?: string
          criado_por?: string
          descricao?: string
          id?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concreteira_esg_concreteira_id_fkey"
            columns: ["concreteira_id"]
            isOneToOne: false
            referencedRelation: "concreteiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concreteira_esg_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      concreteira_esg_documentos: {
        Row: {
          content_type: string | null
          created_at: string
          enviado_por: string
          id: string
          item_id: string
          nome_arquivo: string
          storage_path: string
          tamanho_bytes: number | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          enviado_por: string
          id?: string
          item_id: string
          nome_arquivo: string
          storage_path: string
          tamanho_bytes?: number | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          enviado_por?: string
          id?: string
          item_id?: string
          nome_arquivo?: string
          storage_path?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "concreteira_esg_documentos_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concreteira_esg_documentos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "concreteira_esg"
            referencedColumns: ["id"]
          },
        ]
      }
      concreteiras: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          razao_social: string
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          razao_social: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          razao_social?: string
          updated_at?: string
        }
        Relationships: []
      }
      construtoras: {
        Row: {
          cnpj_cpf: string
          created_at: string
          id: string
          razao_social: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cnpj_cpf: string
          created_at?: string
          id?: string
          razao_social: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cnpj_cpf?: string
          created_at?: string
          id?: string
          razao_social?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      creditos_retirados: {
        Row: {
          acao_remocao_id: string
          created_at: string
          id: string
          projeto: string
          registro: string
          safra: string | null
          serial: string
          tco2e: number
          titular_aposentadoria: string
        }
        Insert: {
          acao_remocao_id: string
          created_at?: string
          id?: string
          projeto: string
          registro: string
          safra?: string | null
          serial: string
          tco2e: number
          titular_aposentadoria: string
        }
        Update: {
          acao_remocao_id?: string
          created_at?: string
          id?: string
          projeto?: string
          registro?: string
          safra?: string | null
          serial?: string
          tco2e?: number
          titular_aposentadoria?: string
        }
        Relationships: [
          {
            foreignKeyName: "creditos_retirados_acao_remocao_id_fkey"
            columns: ["acao_remocao_id"]
            isOneToOne: false
            referencedRelation: "acoes_remocao"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_respostas: {
        Row: {
          evidencia: string | null
          id: string
          origem: string
          projeto_id: string
          questao_id: number
          respondido_por: string | null
          resposta: string
          updated_at: string
        }
        Insert: {
          evidencia?: string | null
          id?: string
          origem?: string
          projeto_id: string
          questao_id: number
          respondido_por?: string | null
          resposta: string
          updated_at?: string
        }
        Update: {
          evidencia?: string | null
          id?: string
          origem?: string
          projeto_id?: string
          questao_id?: number
          respondido_por?: string | null
          resposta?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_respostas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_captacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostico_respostas_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      entrega_composicao: {
        Row: {
          created_at: string
          entrega_id: string
          fator_id: string | null
          id: string
          insumo: string
          quantidade: number
          unidade: string
        }
        Insert: {
          created_at?: string
          entrega_id: string
          fator_id?: string | null
          id?: string
          insumo: string
          quantidade: number
          unidade: string
        }
        Update: {
          created_at?: string
          entrega_id?: string
          fator_id?: string | null
          id?: string
          insumo?: string
          quantidade?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrega_composicao_entrega_id_fkey"
            columns: ["entrega_id"]
            isOneToOne: false
            referencedRelation: "entregas_concreto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrega_composicao_fator_id_fkey"
            columns: ["fator_id"]
            isOneToOne: false
            referencedRelation: "fatores_emissao"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas_concreto: {
        Row: {
          concreteira_id: string
          created_at: string
          criado_por: string
          data_entrega: string
          evidencia_id: string | null
          id: string
          materializado_em: string | null
          materializado_por: string | null
          obra_concreteira_id: string
          obra_id: string
          status: string
          traco: string | null
          volume_m3: number
        }
        Insert: {
          concreteira_id: string
          created_at?: string
          criado_por: string
          data_entrega: string
          evidencia_id?: string | null
          id?: string
          materializado_em?: string | null
          materializado_por?: string | null
          obra_concreteira_id: string
          obra_id: string
          status?: string
          traco?: string | null
          volume_m3: number
        }
        Update: {
          concreteira_id?: string
          created_at?: string
          criado_por?: string
          data_entrega?: string
          evidencia_id?: string | null
          id?: string
          materializado_em?: string | null
          materializado_por?: string | null
          obra_concreteira_id?: string
          obra_id?: string
          status?: string
          traco?: string | null
          volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "entregas_concreto_concreteira_id_fkey"
            columns: ["concreteira_id"]
            isOneToOne: false
            referencedRelation: "concreteiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_concreto_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_concreto_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: false
            referencedRelation: "evidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_concreto_materializado_por_fkey"
            columns: ["materializado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_concreto_obra_concreteira_id_fkey"
            columns: ["obra_concreteira_id"]
            isOneToOne: false
            referencedRelation: "obra_concreteiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_concreto_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias: {
        Row: {
          chave_acesso: string | null
          cnpj_emitente: string | null
          created_at: string
          hash_sha256: string
          id: string
          obra_id: string
          resultado_consulta_externa: Json | null
          status_validacao: string
          storage_path: string
          tipo: string
        }
        Insert: {
          chave_acesso?: string | null
          cnpj_emitente?: string | null
          created_at?: string
          hash_sha256: string
          id?: string
          obra_id: string
          resultado_consulta_externa?: Json | null
          status_validacao?: string
          storage_path: string
          tipo: string
        }
        Update: {
          chave_acesso?: string | null
          cnpj_emitente?: string | null
          created_at?: string
          hash_sha256?: string
          id?: string
          obra_id?: string
          resultado_consulta_externa?: Json | null
          status_validacao?: string
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      fatores_emissao: {
        Row: {
          ano_base: number
          categoria: string
          created_at: string
          fonte: string
          id: string
          incerteza_pct: number | null
          unidade: string
          valor: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ano_base: number
          categoria: string
          created_at?: string
          fonte: string
          id?: string
          incerteza_pct?: number | null
          unidade: string
          valor: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          ano_base?: number
          categoria?: string
          created_at?: string
          fonte?: string
          id?: string
          incerteza_pct?: number | null
          unidade?: string
          valor?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      fiscalizacoes: {
        Row: {
          agendado_para: string | null
          checklist_aplicado: Json
          constatacoes: Json
          coordenada_execucao: unknown
          created_at: string
          fiscal_id: string
          id: string
          midias: Json
          obra_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agendado_para?: string | null
          checklist_aplicado?: Json
          constatacoes?: Json
          coordenada_execucao?: unknown
          created_at?: string
          fiscal_id: string
          id?: string
          midias?: Json
          obra_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agendado_para?: string | null
          checklist_aplicado?: Json
          constatacoes?: Json
          coordenada_execucao?: unknown
          created_at?: string
          fiscal_id?: string
          id?: string
          midias?: Json
          obra_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscalizacoes_fiscal_id_fkey"
            columns: ["fiscal_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscalizacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      inventarios: {
        Row: {
          created_at: string
          hash_fechamento: string | null
          homologado_em: string | null
          id: string
          nivel_garantia: number
          obra_id: string
          periodo_fim: string | null
          periodo_inicio: string
          responsavel_tecnico_id: string | null
          status: string
          versao: number
        }
        Insert: {
          created_at?: string
          hash_fechamento?: string | null
          homologado_em?: string | null
          id?: string
          nivel_garantia?: number
          obra_id: string
          periodo_fim?: string | null
          periodo_inicio: string
          responsavel_tecnico_id?: string | null
          status?: string
          versao: number
        }
        Update: {
          created_at?: string
          hash_fechamento?: string | null
          homologado_em?: string | null
          id?: string
          nivel_garantia?: number
          obra_id?: string
          periodo_fim?: string | null
          periodo_inicio?: string
          responsavel_tecnico_id?: string | null
          status?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventarios_responsavel_tecnico_id_fkey"
            columns: ["responsavel_tecnico_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          created_at: string
          evidencia_id: string | null
          fator_id: string | null
          id: string
          incerteza_pct: number | null
          inventario_id: string
          item: string
          modulo_en15978: string
          natureza: string
          quantidade: number
          tco2e: number
          unidade: string
        }
        Insert: {
          created_at?: string
          evidencia_id?: string | null
          fator_id?: string | null
          id?: string
          incerteza_pct?: number | null
          inventario_id: string
          item: string
          modulo_en15978: string
          natureza: string
          quantidade: number
          tco2e: number
          unidade: string
        }
        Update: {
          created_at?: string
          evidencia_id?: string | null
          fator_id?: string | null
          id?: string
          incerteza_pct?: number | null
          inventario_id?: string
          item?: string
          modulo_en15978?: string
          natureza?: string
          quantidade?: number
          tco2e?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: false
            referencedRelation: "evidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fator_id_fkey"
            columns: ["fator_id"]
            isOneToOne: false
            referencedRelation: "fatores_emissao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mudas: {
        Row: {
          acao_remocao_id: string
          checkpoints: Json
          coordenadas: unknown
          created_at: string
          data_plantio: string
          especie: string
          id: string
        }
        Insert: {
          acao_remocao_id: string
          checkpoints?: Json
          coordenadas: unknown
          created_at?: string
          data_plantio: string
          especie: string
          id?: string
        }
        Update: {
          acao_remocao_id?: string
          checkpoints?: Json
          coordenadas?: unknown
          created_at?: string
          data_plantio?: string
          especie?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mudas_acao_remocao_id_fkey"
            columns: ["acao_remocao_id"]
            isOneToOne: false
            referencedRelation: "acoes_remocao"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          cnpj: string | null
          codigo_ibge: string | null
          created_at: string
          faixa_regua: Json
          id: string
          nome: string
          teto_compensacao_pct: number
          uf: string
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          cnpj?: string | null
          codigo_ibge?: string | null
          created_at?: string
          faixa_regua?: Json
          id?: string
          nome: string
          teto_compensacao_pct?: number
          uf: string
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          cnpj?: string | null
          codigo_ibge?: string | null
          created_at?: string
          faixa_regua?: Json
          id?: string
          nome?: string
          teto_compensacao_pct?: number
          uf?: string
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      obra_concreteiras: {
        Row: {
          concreteira_id: string
          convidado_por: string | null
          created_at: string
          id: string
          obra_id: string
          status: string
        }
        Insert: {
          concreteira_id: string
          convidado_por?: string | null
          created_at?: string
          id?: string
          obra_id: string
          status?: string
        }
        Update: {
          concreteira_id?: string
          convidado_por?: string | null
          created_at?: string
          id?: string
          obra_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_concreteiras_concreteira_id_fkey"
            columns: ["concreteira_id"]
            isOneToOne: false
            referencedRelation: "concreteiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_concreteiras_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_concreteiras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_documentos: {
        Row: {
          content_type: string | null
          created_at: string
          descricao: string | null
          enviado_por: string
          id: string
          nome_arquivo: string
          obra_id: string
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          descricao?: string | null
          enviado_por: string
          id?: string
          nome_arquivo: string
          obra_id: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          descricao?: string | null
          enviado_por?: string
          id?: string
          nome_arquivo?: string
          obra_id?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_documentos_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_documentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          alvara_numero: string
          area_categoria: string | null
          area_construida_m2: number
          area_destinacao: string | null
          area_tipo_obra: string | null
          bairro: string | null
          cep: string | null
          cno: string | null
          complemento: string | null
          construtora_id: string
          coordenadas: unknown
          created_at: string
          data_alvara: string | null
          data_final_obra: string | null
          data_inicio_obra: string | null
          fase: string
          id: string
          inscricao_imobiliaria: string | null
          latitude: number | null
          limite_inventario: Json
          logradouro: string | null
          longitude: number | null
          municipio_id: string
          nome: string
          numero_imovel: string | null
          resp_tecnico_documento: string | null
          resp_tecnico_nome: string | null
          resp_tecnico_registro: string | null
          resp_tecnico_tipo: string | null
          responsavel_exec_obra: string | null
          tipo_alvara: string | null
          tipo_logradouro: string | null
          tipologia: string
          updated_at: string
        }
        Insert: {
          alvara_numero: string
          area_categoria?: string | null
          area_construida_m2: number
          area_destinacao?: string | null
          area_tipo_obra?: string | null
          bairro?: string | null
          cep?: string | null
          cno?: string | null
          complemento?: string | null
          construtora_id: string
          coordenadas?: unknown
          created_at?: string
          data_alvara?: string | null
          data_final_obra?: string | null
          data_inicio_obra?: string | null
          fase?: string
          id?: string
          inscricao_imobiliaria?: string | null
          latitude?: number | null
          limite_inventario?: Json
          logradouro?: string | null
          longitude?: number | null
          municipio_id: string
          nome?: string
          numero_imovel?: string | null
          resp_tecnico_documento?: string | null
          resp_tecnico_nome?: string | null
          resp_tecnico_registro?: string | null
          resp_tecnico_tipo?: string | null
          responsavel_exec_obra?: string | null
          tipo_alvara?: string | null
          tipo_logradouro?: string | null
          tipologia: string
          updated_at?: string
        }
        Update: {
          alvara_numero?: string
          area_categoria?: string | null
          area_construida_m2?: number
          area_destinacao?: string | null
          area_tipo_obra?: string | null
          bairro?: string | null
          cep?: string | null
          cno?: string | null
          complemento?: string | null
          construtora_id?: string
          coordenadas?: unknown
          created_at?: string
          data_alvara?: string | null
          data_final_obra?: string | null
          data_inicio_obra?: string | null
          fase?: string
          id?: string
          inscricao_imobiliaria?: string | null
          latitude?: number | null
          limite_inventario?: Json
          logradouro?: string | null
          longitude?: number | null
          municipio_id?: string
          nome?: string
          numero_imovel?: string | null
          resp_tecnico_documento?: string | null
          resp_tecnico_nome?: string | null
          resp_tecnico_registro?: string | null
          resp_tecnico_tipo?: string | null
          responsavel_exec_obra?: string | null
          tipo_alvara?: string | null
          tipo_logradouro?: string | null
          tipologia?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "construtoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          concreteira_id: string | null
          construtora_id: string | null
          created_at: string
          id: string
          municipio_id: string | null
          nome: string
          papel: string
        }
        Insert: {
          concreteira_id?: string | null
          construtora_id?: string | null
          created_at?: string
          id: string
          municipio_id?: string | null
          nome: string
          papel: string
        }
        Update: {
          concreteira_id?: string | null
          construtora_id?: string | null
          created_at?: string
          id?: string
          municipio_id?: string | null
          nome?: string
          papel?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_concreteira_id_fkey"
            columns: ["concreteira_id"]
            isOneToOne: false
            referencedRelation: "concreteiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "construtoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_documentos: {
        Row: {
          atualizado_por: string | null
          content_type: string | null
          documento_id: number
          id: string
          nome_arquivo: string | null
          observacao: string | null
          projeto_id: string
          situacao: string
          storage_path: string | null
          tamanho_bytes: number | null
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          content_type?: string | null
          documento_id: number
          id?: string
          nome_arquivo?: string | null
          observacao?: string | null
          projeto_id: string
          situacao?: string
          storage_path?: string | null
          tamanho_bytes?: number | null
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          content_type?: string | null
          documento_id?: number
          id?: string
          nome_arquivo?: string | null
          observacao?: string | null
          projeto_id?: string
          situacao?: string
          storage_path?: string | null
          tamanho_bytes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_documentos_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_documentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_captacao"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_esg_documentos: {
        Row: {
          content_type: string | null
          created_at: string
          enviado_por: string
          id: string
          nome_arquivo: string
          projeto_id: string
          storage_path: string
          tamanho_bytes: number | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          enviado_por: string
          id?: string
          nome_arquivo: string
          projeto_id: string
          storage_path: string
          tamanho_bytes?: number | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          enviado_por?: string
          id?: string
          nome_arquivo?: string
          projeto_id?: string
          storage_path?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_esg_documentos_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_esg_documentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_esg"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos_captacao: {
        Row: {
          created_at: string
          criado_por: string
          descricao: string
          id: string
          municipio_id: string
          nome: string
          situacao: string
          tema: string
          updated_at: string
          valor_estimado_brl: number | null
        }
        Insert: {
          created_at?: string
          criado_por: string
          descricao: string
          id?: string
          municipio_id: string
          nome: string
          situacao?: string
          tema: string
          updated_at?: string
          valor_estimado_brl?: number | null
        }
        Update: {
          created_at?: string
          criado_por?: string
          descricao?: string
          id?: string
          municipio_id?: string
          nome?: string
          situacao?: string
          tema?: string
          updated_at?: string
          valor_estimado_brl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_captacao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_captacao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos_esg: {
        Row: {
          categoria: string
          construtora_id: string
          created_at: string
          criado_por: string
          decidido_em: string | null
          descricao: string
          enviado_em: string | null
          id: string
          motivo_decisao: string | null
          obra_id: string
          requisito_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          construtora_id: string
          created_at?: string
          criado_por: string
          decidido_em?: string | null
          descricao: string
          enviado_em?: string | null
          id?: string
          motivo_decisao?: string | null
          obra_id: string
          requisito_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          construtora_id?: string
          created_at?: string
          criado_por?: string
          decidido_em?: string | null
          descricao?: string
          enviado_em?: string | null
          id?: string
          motivo_decisao?: string | null
          obra_id?: string
          requisito_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_esg_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "construtoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_esg_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_esg_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_esg_requisito_id_fkey"
            columns: ["requisito_id"]
            isOneToOne: false
            referencedRelation: "requisitos_auditoria"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitos_auditoria: {
        Row: {
          codigo: string
          created_at: string
          evidencia_primaria: string
          id: string
          natureza: string
          ordem: number
          requisito: string
          teste_verificacao: string
          unidade: string
        }
        Insert: {
          codigo: string
          created_at?: string
          evidencia_primaria: string
          id?: string
          natureza: string
          ordem?: number
          requisito: string
          teste_verificacao: string
          unidade: string
        }
        Update: {
          codigo?: string
          created_at?: string
          evidencia_primaria?: string
          id?: string
          natureza?: string
          ordem?: number
          requisito?: string
          teste_verificacao?: string
          unidade?: string
        }
        Relationships: []
      }
      selos: {
        Row: {
          beneficio_concedido: Json | null
          condicionantes: Json | null
          created_at: string
          faixa_atingida_kgco2e_m2: number
          id: string
          inventario_id: string
          motivo_revogacao: string | null
          nivel: string
          obra_id: string
          revogado_em: string | null
          validade: string | null
        }
        Insert: {
          beneficio_concedido?: Json | null
          condicionantes?: Json | null
          created_at?: string
          faixa_atingida_kgco2e_m2: number
          id?: string
          inventario_id: string
          motivo_revogacao?: string | null
          nivel: string
          obra_id: string
          revogado_em?: string | null
          validade?: string | null
        }
        Update: {
          beneficio_concedido?: Json | null
          condicionantes?: Json | null
          created_at?: string
          faixa_atingida_kgco2e_m2?: number
          id?: string
          inventario_id?: string
          motivo_revogacao?: string | null
          nivel?: string
          obra_id?: string
          revogado_em?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "selos_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      sisobra_envios: {
        Row: {
          competencia: string
          created_at: string
          id: string
          mensagem_erro: string | null
          municipio_id: string
          protocolo: string | null
          registrado_por: string | null
          status: string
          tipo: string
          total_alvaras: number
          transmitido_em: string | null
        }
        Insert: {
          competencia: string
          created_at?: string
          id?: string
          mensagem_erro?: string | null
          municipio_id: string
          protocolo?: string | null
          registrado_por?: string | null
          status?: string
          tipo: string
          total_alvaras?: number
          transmitido_em?: string | null
        }
        Update: {
          competencia?: string
          created_at?: string
          id?: string
          mensagem_erro?: string | null
          municipio_id?: string
          protocolo?: string | null
          registrado_por?: string | null
          status?: string
          tipo?: string
          total_alvaras?: number
          transmitido_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sisobra_envios_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisobra_envios_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_auditoria: {
        Row: {
          acao: string
          ator_id: string | null
          criado_em: string
          diff: Json | null
          entidade: string
          entidade_id: string
          id: string
          ip: unknown
        }
        Insert: {
          acao: string
          ator_id?: string | null
          criado_em?: string
          diff?: Json | null
          entidade: string
          entidade_id: string
          id?: string
          ip?: unknown
        }
        Update: {
          acao?: string
          ator_id?: string | null
          criado_em?: string
          diff?: Json | null
          entidade?: string
          entidade_id?: string
          id?: string
          ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "trilha_auditoria_ator_id_fkey"
            columns: ["ator_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_concreteira_por_cnpj: { Args: { p_cnpj: string }; Returns: string }
      concreteira_atua_no_municipio: {
        Args: { p_concreteira_id: string }
        Returns: boolean
      }
      concreteira_vinculada_na_obra: {
        Args: { p_obra_id: string }
        Returns: boolean
      }
      construtora_vinculada_a_concreteira: {
        Args: { p_concreteira_id: string }
        Returns: boolean
      }
      current_concreteira_id: { Args: never; Returns: string }
      current_construtora_id: { Args: never; Returns: string }
      current_municipio_id: { Args: never; Returns: string }
      current_papel: { Args: never; Returns: string }
      fiscal_designado_na_obra: {
        Args: { p_obra_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

