package noran.desktop.Controllers;

import java.io.Serializable;
import java.util.Objects;

/**
 * Application-level user model used across the desktop app.
 * Contains a display name and an identifier (id).
 */
public class User implements Serializable {

	private static final long serialVersionUID = 1L;

	private String id;
	private String name;

	public User() {
		// default constructor for frameworks/serialization
	}

	public User(String id, String name) {
		this.id = id;
		this.name = name;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}





	@Override
	public String toString() {
		return "User{" +
				"id='" + id + '\'' +
				", name='" + name + '\'' +
				'}';
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		User user = (User) o;
		return Objects.equals(id, user.id) && Objects.equals(name, user.name);
	}

	@Override
	public int hashCode() {
		return Objects.hash(id, name);
	}
}

