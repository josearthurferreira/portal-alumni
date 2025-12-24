import { useEffect, useState } from 'react';

export function useIbgeLocations(isOpen, stateUf, enabled = true) {
  const [ufs, setUfs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingUfs, setLoadingUfs] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Carrega UFs (IBGE) ao abrir (somente se enabled)
  useEffect(() => {
    if (!isOpen || !enabled) {
      setUfs([]);
      setLoadingUfs(false);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    async function loadUfs() {
      try {
        setLoadingUfs(true);
        const res = await fetch(
          'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
          { signal: ctrl.signal },
        );
        const data = await res.json();
        if (!cancelled) setUfs(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setUfs([]);
      } finally {
        if (!cancelled) setLoadingUfs(false);
      }
    }

    loadUfs();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [isOpen, enabled]);

  // UF mudou -> busca municípios daquela UF (somente se enabled)
  useEffect(() => {
    if (!isOpen || !enabled) {
      setCities([]);
      setLoadingCities(false);
      return;
    }

    setCities([]);

    if (!stateUf || !ufs.length) return;

    const ufObj = ufs.find((u) => u.sigla === stateUf);
    if (!ufObj?.id) return;

    let cancelled = false;
    const ctrl = new AbortController();

    async function loadCities() {
      try {
        setLoadingCities(true);
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufObj.id}/municipios?orderBy=nome`,
          { signal: ctrl.signal },
        );
        const data = await res.json();

        if (!cancelled) {
          setCities(
            Array.isArray(data) ? data.map((m) => m.nome).filter(Boolean) : [],
          );
        }
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    }

    loadCities();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [isOpen, enabled, stateUf, ufs]);

  return { ufs, cities, loadingUfs, loadingCities };
}
