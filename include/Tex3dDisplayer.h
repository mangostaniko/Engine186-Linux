#pragma once

#include "Tex3D.h"

namespace e186
{

	class Tex3dDisplayer
	{
	public:
		Tex3dDisplayer(Tex3D& tex3d);

		void Render(const glm::mat4& mM, const glm::mat4& vM, const glm::mat4& pM);
		void Render(const glm::mat4& vM, const glm::mat4& pM); // use AntTweakBar transforms

	private:
		Tex3D& m_tex3d;
		Shader m_shader;
		GLuint m_instPosBuffer;
		GLuint m_posBuffer;
		GLuint m_nrmBuffer;
		GLuint m_elBuffer;
		GLuint m_vao;
		GLsizei m_indices_len;

		glm::vec3 m_element_pos;
		float m_element_scale;
		glm::vec3 m_element_rotation_axis;
		float m_element_rotation_angle;
		AntTweakBarHandle m_twbar;
	};

}
