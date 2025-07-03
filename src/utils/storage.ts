import localforage from "localforage";

// Configuração (opcional)
localforage.config({
  name: "GestaoVendas",
  storeName: "local_storage"
});

// Salvar dados
export const saveToStorage = async (key: string, value: any) => {
  await localforage.setItem(key, value);
};

// Buscar dados
export const getFromStorage = async (key: string) => {
  return await localforage.getItem(key);
};

// Remover dados
export const removeFromStorage = async (key: string) => {
  await localforage.removeItem(key);
};
