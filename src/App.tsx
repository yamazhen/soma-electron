import { Routes, Route, HashRouter } from "react-router-dom";
import Search from "./features/notes/search/Search";
import MainWindow from "./components/layout/MainWindow";
import Settings from "./components/layout/settings/Settings";
import { setInitialTheme, useThemeListener } from "./hooks/themeHooks";
import Auth from "./components/layout/auth/Auth";

function App() {
	setInitialTheme();
	useThemeListener();

	return (
		<HashRouter>
			<Routes>
				<Route path="/" element={<MainWindow />} />
				<Route path="/search" element={<Search />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/auth" element={<Auth />} />
			</Routes>
		</HashRouter>
	);
}

export default App;
