#pragma once

namespace e186
{
	class QuakeCamera : public Camera
	{
	public:
		QuakeCamera();
		~QuakeCamera();

		void HandleInputOnly();
		void Update(double deltaTime);

		float rotation_speed() const { return m_rotation_speed; }
		float move_speed() const { return m_move_speed; }
		float fast_multiplier() const { return m_fast_multiplier; }
		float slow_multiplier() const { return m_slow_multiplier; }

		void set_rotation_speed(float value) { m_rotation_speed = value; }
		void set_move_speed(float value) { m_move_speed = value; }
		void set_fast_multiplier(float value) { m_fast_multiplier = value; }
		void set_slow_multiplier(float value) { m_slow_multiplier = value; }

	private:
		float m_rotation_speed;
		float m_move_speed;
		float m_fast_multiplier;
		float m_slow_multiplier;

		glm::vec2 m_accumulated_mouse_movement;
		bool m_capture_input;
		bool m_f_pressed;
		bool m_i_pressed;

		std::function<void(GLFWwindow*, int, int, int, int)> m_key_handler;

		void AddToCameraPositionRelative(const glm::vec4& homoVectorToAdd, double deltaTime);
		void AddToCameraPositionAbsolute(const glm::vec4& homoVectorToAdd, double deltaTime);

	};
}
