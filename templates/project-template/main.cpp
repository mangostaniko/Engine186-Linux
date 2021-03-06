// project.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include "SceneSelectorScene.h"
#include "SampleSceneTessIco.h"
#include "ModelExplorerScene.h"

int main()
{
	e186::Engine::StartWindowedWithRootScene(1600, 900, []()
	{
		auto sel_scene = std::make_unique<e186::SceneSelectorScene>();
		sel_scene->AddScene<e186::SampleSceneTessIco>();
		sel_scene->AddSceneGenFunc("Model Explorer: Sponza", []() { return std::make_unique<e186::ModelExplorerScene>("assets/models/sponza/sponza.obj", glm::mat4(1.0f)); });
		return sel_scene;
	});
}

