package hello;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.Date;
import java.util.List;

@Service
public interface DateRepository extends JpaRepository<Event, Long> {
    List<Event> findByAccountIdAndDateFromBetween(Integer id, Date dateFrom, Date dateFrom2);
    Event findByAccountIdAndDateFromAndDateTo(Integer id, Date dateFrom, Date dateTo);

    // TODO: 14.10.2018 after tests make return single Event
    @Query("select e from Event e where e.accountId = ?1 and e.id <> ?2 and " +
            "                          (e.dateFrom between ?3 and ?4 or e.dateTo between ?3 and ?4)")
    List<Event> findByDateFromInsideOrDateToInside(Integer accountId, Integer id, Date dateFrom, Date dateTo);

    @Query("select e from Event e where e.accountId = ?1 and e.id <> ?2 and " +
            "                           (?3 between e.dateFrom and e.dateTo or ?4 between e.dateFrom and e.dateTo)")
    List<Event> findThisEventInsideOther(Integer accountId, Integer id, Date dateFrom, Date dateTo);

    @Modifying
    @Transactional
    Integer deleteByAccountIdAndDateFromAndDateTo(Integer accountId, Date dateFrom, Date dateTo);
}
