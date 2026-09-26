/**
 * Compile-checked minimal examples for every High-usefulness Plugin API 1.0.0
 * capability. They are intentionally not run by the demo plugin.
 */
export async function exerciseHighUsefulnessAPI(
	api: PluginAPI,
	filePath: string,
	workspaceFile: WorkspaceFolderFileRef,
): Promise<void> {
	const pane = api.explorer.getActivePane();
	if (pane) {
		await pane.listing.refresh();
		pane.selection.set(pane.listing.entries.slice(0, 1).map((file) => file.path));
		await pane.navigation.openPath(filePath);
	}

	await api.files.toAssetUrl(filePath);
	const binary = await api.files.readBinary(filePath);
	await api.files.writeBinary(filePath, binary.content, {
		expectedRevision: binary.revision,
	});
	const controller = new AbortController();
	await api.files.getFolderSummary(api.files.getDirname(filePath), {
		signal: controller.signal,
	});

	await api.git.getInfo(api.files.getDirname(filePath));
	await api.git.getLanguages(api.files.getDirname(filePath));

	const folders = await api.workspaceFolders.listKnown();
	if (folders[0]) {
		await api.workspaceFolders.getSchema(folders[0].id);
	}
	await api.workspaceFolders.getPropertyValue(workspaceFile, "status");
	await api.workspaceFolders.setPropertyValues(workspaceFile, [
		{ propertyId: "rating", value: 4 },
	]);
	await api.workspaceFolders.setTags(workspaceFile, ["Example"]);
	await api.workspaceFolders.setRating(workspaceFile, 4);
	await api.workspaceFolders.openPage(workspaceFile, {
		sourcePaneId: pane?.id,
	});

	await api.openSettings();
	await api.settings.open();
}
