import { GlobalCfgCard } from "../components/advance/GlobalCfgCard";
import { MappingCfgCard } from "../components/advance/MappingCfgCard";
import { OutputCfgCard } from "../components/advance/OutputCfgCard";
import { useBlueRetro } from "../components/BlueRetroContext";
import { CfgSelection } from "../components/CfgSelection";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { docs } from "../lib/docs";

export function Advance() {
  const { connected } = useBlueRetro();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advance Config"
        description="Global settings, per output behaviour and the full button mapping table."
        doc={docs.advance}
      />

      {!connected && <NotConnected what="edit the configuration" />}

      {connected && (
        <>
          <CfgSelection doc={docs.cfgSelection} />
          <GlobalCfgCard />
          <OutputCfgCard />
          <MappingCfgCard />
        </>
      )}
    </div>
  );
}
