import { useMemo } from 'react';
import { Country, State, City } from 'country-state-city';
import { useIbgeLocations } from './useIbgeLocations';

function sortByNamePtBr(a, b) {
  return (a?.name || '').localeCompare(b?.name || '', 'pt-BR');
}

export function useCountryLocations(isOpen, countryIso2, stateCode) {
  const isBrazil = countryIso2 === 'BR';

  // Países (sempre disponível, offline)
  const countries = useMemo(() => {
    const list = Country.getAllCountries()
      .map((c) => ({ name: c.name, iso2: c.isoCode }))
      .filter((c) => c.iso2 && c.name)
      .sort((a, b) => {
        // Brasil no topo
        if (a.iso2 === 'BR') return -1;
        if (b.iso2 === 'BR') return 1;
        return sortByNamePtBr(a, b);
      });

    return list;
  }, []);

  // IBGE (somente quando Brasil)
  const ibge = useIbgeLocations(isOpen, isBrazil ? stateCode : '', isBrazil);

  // Estados: BR = IBGE, fora BR = CSC
  const states = useMemo(() => {
    if (!isOpen) return [];

    if (isBrazil) {
      return (ibge.ufs || []).map((u) => ({
        code: u.sigla,
        name: u.nome,
      }));
    }

    if (!countryIso2) return [];

    return State.getStatesOfCountry(countryIso2)
      .map((s) => ({
        code: s.isoCode || s.name, // fallback
        name: s.name,
      }))
      .filter((s) => s.code && s.name)
      .sort(sortByNamePtBr);
  }, [isOpen, isBrazil, countryIso2, ibge.ufs]);

  // Cidades: BR = IBGE, fora BR = CSC
  const cities = useMemo(() => {
    if (!isOpen) return [];

    if (isBrazil) {
      return Array.isArray(ibge.cities) ? ibge.cities : [];
    }

    if (!countryIso2 || !stateCode) return [];

    return City.getCitiesOfState(countryIso2, stateCode)
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [isOpen, isBrazil, countryIso2, stateCode, ibge.cities]);

  return {
    countries,
    states,
    cities,
    isBrazil,
    loadingStates: isBrazil ? ibge.loadingUfs : false,
    loadingCities: isBrazil ? ibge.loadingCities : false,
  };
}
