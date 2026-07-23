import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { EconomyLedgerEntry, InventoryItem, ShopItem, WalletBalance } from "../../domain/models/AppModels";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

export function ShopScreen() {
  const { api } = useAppContainer();
  const [catalog, setCatalog] = useState<ShopItem[]>(localCatalog);
  const [wallets, setWallets] = useState<WalletBalance[]>(localWallets);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ledger, setLedger] = useState<EconomyLedgerEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const ownedIds = useMemo(() => new Set(inventory.map((item) => item.item_id)), [inventory]);
  const coins = wallets.find((wallet) => wallet.currency === "coins")?.balance ?? 0;
  const crystals = wallets.find((wallet) => wallet.currency === "crystals")?.balance ?? 0;

  async function load() {
    setIsBusy(true);
    setMessage(null);
    try {
      if (!api.isConfigured()) {
        setCatalog(localCatalog);
        setWallets(localWallets);
        return;
      }

      const [items, state] = await Promise.all([api.listShopItems(), api.getInventory()]);
      setCatalog(items);
      setWallets(state.wallets);
      setInventory(state.inventory);
      setLedger(state.ledger);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo cargar la tienda.");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function purchase(item: ShopItem) {
    setMessage(null);
    try {
      if (!api.isConfigured()) {
        setInventory([
          ...inventory,
          {
            player_id: "local-rider",
            item_id: item.id,
            code: item.code,
            kind: item.kind,
            name: item.name,
            description: item.description,
            asset_path: item.asset_path,
            rarity: item.rarity ?? "common",
            acquired_at: new Date().toISOString(),
            equipped_at: null,
            is_equipped: false
          }
        ]);
        setMessage("Cosmetico agregado al inventario local.");
        return;
      }

      await api.purchaseShopItem(item.id);
      await load();
      setMessage("Cosmetico agregado al inventario.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo completar la compra.");
    }
  }

  async function equip(item: InventoryItem) {
    setMessage(null);
    try {
      if (!api.isConfigured()) {
        setInventory((current) =>
          current.map((owned) =>
            owned.kind === item.kind
              ? { ...owned, is_equipped: owned.item_id === item.item_id, equipped_at: owned.item_id === item.item_id ? new Date().toISOString() : null }
              : owned
          )
        );
        setMessage("Cosmetico equipado localmente.");
        return;
      }

      await api.equipItem(item.item_id);
      await load();
      setMessage("Cosmetico equipado.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo equipar.");
    }
  }

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Tienda</Text>
        <Text style={appStyles.title}>Solo cosmeticos</Text>
        <Text style={appStyles.body}>
          Monedas, cristales e inventario visual. Ningun objeto modifica velocidad, conquista o batalla.
        </Text>
      </View>

      {message ? <Text style={{ color: message.includes("No ") ? colors.red : colors.green }}>{message}</Text> : null}

      <Panel title="Wallet">
        <View style={appStyles.row}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>Coins: {coins}</Text>
          <Text style={{ color: colors.cyan, fontWeight: "800" }}>Crystals: {crystals}</Text>
        </View>
      </Panel>

      <Panel title="Catalogo">
        <View style={{ gap: 12 }}>
          {catalog.map((item) => {
            const owned = ownedIds.has(item.id);
            return (
              <View key={item.id} style={{ gap: 8 }}>
                <View style={appStyles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>
                      {item.name}
                    </Text>
                    <Text style={appStyles.body}>{item.description}</Text>
                    <Text style={[appStyles.body, { color: rarityColor(item.rarity) }]}>
                      {(item.rarity ?? "common").toUpperCase()} - {item.kind}
                    </Text>
                  </View>
                  <Text style={{ color: item.price_currency === "coins" ? colors.orange : colors.cyan, fontWeight: "800" }}>
                    {item.price_amount} {item.price_currency}
                  </Text>
                </View>
                <ActionButton
                  label={owned ? "Comprado" : "Comprar"}
                  variant="secondary"
                  disabled={isBusy || owned}
                  onPress={() => void purchase(item)}
                />
              </View>
            );
          })}
        </View>
      </Panel>

      <Panel title="Inventario">
        <View style={{ gap: 10 }}>
          {inventory.length === 0 ? <Text style={appStyles.body}>Sin cosmeticos todavia.</Text> : null}
          {inventory.map((item) => (
            <View key={item.item_id} style={appStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "800" }}>{item.name}</Text>
                <Text style={appStyles.body}>{item.kind} - {item.rarity}</Text>
              </View>
              <ActionButton
                label={item.is_equipped ? "Equipado" : "Equipar"}
                variant={item.is_equipped ? "primary" : "secondary"}
                disabled={isBusy || item.is_equipped}
                onPress={() => void equip(item)}
              />
            </View>
          ))}
        </View>
      </Panel>

      <Panel title="Ledger">
        <View style={{ gap: 8 }}>
          {ledger.length === 0 ? <Text style={appStyles.body}>Sin movimientos recientes.</Text> : null}
          {ledger.slice(0, 5).map((entry) => (
            <Text key={entry.id} style={appStyles.body}>
              {entry.reason}: {entry.amount} {entry.currency}
            </Text>
          ))}
        </View>
      </Panel>
    </ScrollView>
  );
}

function rarityColor(rarity: ShopItem["rarity"]): string {
  if (rarity === "legendary") return colors.violet;
  if (rarity === "epic") return colors.cyan;
  if (rarity === "rare") return colors.green;
  return colors.faint;
}

const localWallets: WalletBalance[] = [
  { player_id: "local-rider", currency: "coins", balance: 3200, updated_at: new Date().toISOString() },
  { player_id: "local-rider", currency: "crystals", balance: 160, updated_at: new Date().toISOString() }
];

const localCatalog: ShopItem[] = [
  {
    id: "local-neon-frame",
    code: "neon_frame_green",
    name: "Marco Neon Verde",
    kind: "frame",
    price_currency: "coins",
    price_amount: 1200,
    asset_path: "cosmetics/frames/neon_green.png",
    rarity: "rare",
    description: "Marco visual para perfil y conquistas."
  },
  {
    id: "local-voltage-trail",
    code: "voltage_route_trail",
    name: "Estela Voltaje",
    kind: "animation",
    price_currency: "crystals",
    price_amount: 80,
    asset_path: "cosmetics/animations/voltage.json",
    rarity: "epic",
    description: "Efecto visual para rutas compartidas."
  },
  {
    id: "local-city-flag",
    code: "city_banner",
    name: "Bandera Ciudad",
    kind: "flag",
    price_currency: "coins",
    price_amount: 900,
    asset_path: "cosmetics/flags/city_banner.png",
    rarity: "common",
    description: "Bandera visible en territorios conquistados."
  }
];
