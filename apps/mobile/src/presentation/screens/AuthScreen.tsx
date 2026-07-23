import { ActivityIndicator, Text, View } from "react-native";
import type { SessionState } from "../../application/hooks/useSession";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

interface AuthScreenProps {
  session: SessionState;
}

export function AuthScreen({ session }: AuthScreenProps) {
  return (
    <View style={[appStyles.screen, { justifyContent: "space-between" }]}>
      <View style={{ gap: 12 }}>
        <Text style={appStyles.eyebrow}>Cycle Wars</Text>
        <Text style={[appStyles.title, { fontSize: 38 }]}>Conquista la ciudad en bicicleta</Text>
        <Text style={appStyles.body}>
          Inicia una sesión de prueba para grabar rutas, ganar influencia y preparar el mapa de
          guerra territorial.
        </Text>
      </View>

      <Panel title="Acceso">
        <View style={{ gap: 12 }}>
          {session.error ? <Text style={{ color: colors.red }}>{session.error}</Text> : null}
          {session.isLoading ? <ActivityIndicator color={colors.green} /> : null}
          <ActionButton
            label="Entrar como rider de prueba"
            onPress={() => void session.signInAnonymously()}
            disabled={session.isLoading}
          />
          <Text style={[appStyles.body, { fontSize: 13 }]}>
            Correo, Google, Apple y GitHub quedan listos sobre Supabase Auth; esta fase prioriza el
            flujo jugable completo.
          </Text>
        </View>
      </Panel>
    </View>
  );
}
