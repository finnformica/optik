import { paths } from "@/lib/utils";
import { redirect } from "next/navigation";

const SettingsPage = () => {
  redirect(paths.settings.general);
};

export default SettingsPage;
