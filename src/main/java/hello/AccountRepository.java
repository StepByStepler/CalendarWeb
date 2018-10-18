package hello;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public interface AccountRepository extends JpaRepository<Accounts, Long> {
    Accounts findByLoginAndPassword(String login, String password);
    Accounts findByLogin(String login);
}
