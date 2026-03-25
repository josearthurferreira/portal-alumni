import { useMemo } from 'react';
import { Country, State, City } from 'country-state-city';
import { useIbgeLocations } from './useIbgeLocations';

const norm = (v) => String(v ?? '').trim();

function sortByNamePtBr(a, b) {
  return (a?.name || '').localeCompare(b?.name || '', 'pt-BR');
}

export function useCountryLocations(isOpen, countryIso2, stateCode) {
  const iso2 = norm(countryIso2);
  const st = norm(stateCode);
  const isBrazil = iso2 === 'BR';

  const countries = useMemo(() => {
    const list = Country.getAllCountries()
      .map((c) => {
        const iso2 = norm(c.isoCode);
        const originalName = norm(c.name);

        return {
          iso2,
          name: iso2 === 'BR' ? 'Brasil' : originalName,
        };
      })
      .filter((c) => c.iso2 && c.name)
      .sort((a, b) => {
        if (a.iso2 === 'BR') return -1;
        if (b.iso2 === 'BR') return 1;
        return sortByNamePtBr(a, b);
      });

    return list;
  }, []);

  const ibge = useIbgeLocations(isOpen, isBrazil ? st : '', isBrazil);

  const states = useMemo(() => {
    if (!isOpen) return [];

    if (isBrazil) {
      return (ibge.ufs || []).map((u) => ({
        code: norm(u.sigla),
        name: norm(u.nome),
      }));
    }

    if (!iso2) return [];

    return State.getStatesOfCountry(iso2)
      .map((s) => ({ code: norm(s.isoCode || s.name), name: norm(s.name) }))
      .filter((s) => s.code && s.name)
      .sort(sortByNamePtBr);
  }, [isOpen, isBrazil, iso2, ibge.ufs, st]);

  const hasStates = states.length > 0;
  const citiesReady = isOpen && !!iso2 && (!hasStates || !!st);

  const cities = useMemo(() => {
    if (!isOpen) return [];

    if (isBrazil) {
      return Array.isArray(ibge.cities)
        ? ibge.cities.map(norm).filter(Boolean)
        : [];
    }

    if (!iso2) return [];

    if (hasStates) {
      if (!st) return [];
      return City.getCitiesOfState(iso2, st)
        .map((c) => norm(c.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    const list = City.getCitiesOfCountry?.(iso2) || [];
    return (list || [])
      .map((c) => norm(c.name))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [isOpen, isBrazil, iso2, st, ibge.cities, hasStates]);

  const citiesAvailable = citiesReady && cities.length > 0;
  const allowManualCity = citiesReady && cities.length === 0;

  const needsAddressComplement =
    citiesReady && hasStates && !!st && cities.length === 0;

  return {
    countries,
    states,
    cities,
    isBrazil,
    hasStates,
    citiesReady,
    citiesAvailable,
    allowManualCity,
    needsAddressComplement,
    loadingStates: isBrazil ? ibge.loadingUfs : false,
    loadingCities: isBrazil ? ibge.loadingCities : false,
  };
}
